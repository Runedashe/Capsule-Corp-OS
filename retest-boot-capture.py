#!/usr/bin/env python3
"""Capture BIOS and UEFI boot evidence; screenshots require human inspection.

Usage: python3 boot-capture.py /path/CapsuleCorpOS-live-amd64.iso /path/evidence
Requires qemu-system-x86_64 and Ubuntu 24.04's ovmf package. No target disk is
attached. The ISO and firmware code are read-only; UEFI variables use a copy.
Presses Enter once after 30 seconds to select the default live boot menu entry.
Exit zero means screenshots were collected, never that the OS passed a test.
"""

import argparse
import json
import shutil
import socket
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


class QMPError(RuntimeError):
    pass


class QMP:
    """Minimal newline-delimited QMP client, preserving partial socket reads."""

    def __init__(self, connection):
        self.connection = connection
        self.buffer = bytearray()
        self.request_id = 0

    def receive(self, timeout=10):
        deadline = time.monotonic() + timeout
        while b"\n" not in self.buffer:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("QMP response timed out")
            self.connection.settimeout(remaining)
            block = self.connection.recv(65536)
            if not block:
                raise QMPError("QEMU closed the QMP connection")
            self.buffer.extend(block)
            if len(self.buffer) > 4 * 1024 * 1024:
                raise QMPError("Unexpectedly large QMP message")
        raw, _, remainder = self.buffer.partition(b"\n")
        self.buffer = bytearray(remainder)
        return json.loads(raw)

    def command(self, name, arguments=None, timeout=15):
        self.request_id += 1
        request = {"execute": name, "id": self.request_id}
        if arguments is not None:
            request["arguments"] = arguments
        self.connection.sendall((json.dumps(request) + "\n").encode("utf-8"))
        deadline = time.monotonic() + timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("QMP command timed out: " + name)
            reply = self.receive(remaining)
            if reply.get("id") != self.request_id:
                continue  # Asynchronous events may precede the command response.
            if "error" in reply:
                raise QMPError(name + ": " + json.dumps(reply["error"]))
            if "return" not in reply:
                raise QMPError("Malformed QMP response: " + json.dumps(reply))
            return reply["return"]

    def close(self):
        self.connection.close()


def connect_qmp(socket_path, process, deadline):
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise QMPError("QEMU exited before QMP connected; inspect qemu.log")
        connection = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        try:
            connection.settimeout(1)
            connection.connect(str(socket_path))
        except (FileNotFoundError, ConnectionRefusedError, TimeoutError):
            connection.close()
            time.sleep(0.25)
            continue
        client = QMP(connection)
        try:
            greeting = client.receive(timeout=5)
            if "QMP" not in greeting:
                raise QMPError("Missing QMP greeting")
            client.command("qmp_capabilities")
            return client
        except BaseException:
            client.close()
            raise
    raise TimeoutError("QMP socket did not become ready within 20 seconds")


def escaped_option_path(path):
    # QEMU comma-separated option strings escape literal commas by doubling.
    return str(path).replace(",", ",,")


def wait_for_checkpoint(process, deadline):
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise QMPError("QEMU exited before the next checkpoint; inspect qemu.log")
        time.sleep(min(0.5, max(0, deadline - time.monotonic())))
    if process.poll() is not None:
        raise QMPError("QEMU exited before the next checkpoint; inspect qemu.log")


def capture_mode(qemu, iso, output, mode, seconds):
    mode_output = output / mode
    mode_output.mkdir(parents=True, exist_ok=True)
    report = {
        "firmware": mode,
        "result": "capture-incomplete",
        "boot_pass": None,
        "inspection_required": True,
        "note": "Screenshots are evidence only. Inspect the visible screen to determine boot progress and application startup.",
        "serial_note": "The shipped quiet/splash boot options may leave the serial log empty.",
        "iso": str(iso),
        "target_disks": [],
        "acceleration": "tcg",
        "ram_mib": 2048,
        "virtual_cpus": 2,
        "input_events": [],
        "snapshots": [],
    }
    process = None
    qmp = None
    started = time.monotonic()
    try:
        # A short path avoids the Unix-domain socket pathname length limit.
        with tempfile.TemporaryDirectory(prefix="capsule-qmp-") as temporary:
            temp = Path(temporary)
            socket_path = temp / "qmp.sock"
            command = [
                qemu, "-machine", "q35", "-accel", "tcg,thread=multi",
                "-m", "2048", "-smp", "2", "-display", "none", "-vga", "std",
                "-monitor", "none", "-serial", "file:" + str(mode_output / "serial.log"),
                "-qmp", "unix:" + escaped_option_path(socket_path) + ",server=on,wait=off",
                "-boot", "order=d,menu=off", "-no-reboot", "-nic", "user,model=e1000",
                "-blockdev", json.dumps({
                    "driver": "raw", "node-name": "capsule_iso", "read-only": True,
                    "file": {"driver": "file", "filename": str(iso)},
                }),
                "-device", "ide-cd,drive=capsule_iso",
            ]
            if mode == "uefi":
                code = Path("/usr/share/OVMF/OVMF_CODE_4M.fd")
                original_vars = Path("/usr/share/OVMF/OVMF_VARS_4M.fd")
                for firmware in (code, original_vars):
                    if not firmware.is_file():
                        raise FileNotFoundError("Install Ubuntu's ovmf package; missing " + str(firmware))
                vars_copy = temp / "OVMF_VARS_4M.fd"
                shutil.copyfile(original_vars, vars_copy)
                command.extend([
                    "-drive", "if=pflash,format=raw,unit=0,readonly=on,file=" + escaped_option_path(code),
                    "-drive", "if=pflash,format=raw,unit=1,file=" + escaped_option_path(vars_copy),
                ])
                report["secure_boot_tested"] = False
            report["command"] = command
            with (mode_output / "qemu.log").open("wb") as log:
                try:
                    process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT)
                    qmp = connect_qmp(socket_path, process, time.monotonic() + 20)
                    wait_for_checkpoint(process, started + 30)
                    # https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#command-send-key
                    boot_key = {
                        "command": "send-key",
                        "arguments": {"keys": [{"type": "qcode", "data": "ret"}], "hold-time": 100},
                        "scheduled_seconds": 30,
                        "elapsed_seconds": round(time.monotonic() - started, 1),
                        "purpose": "Select the default live boot menu entry",
                        "result": "pending",
                    }
                    report["input_events"].append(boot_key)
                    boot_key["qmp_reply"] = qmp.command(boot_key["command"], boot_key["arguments"])
                    boot_key["result"] = "sent"
                    print(mode + ": sent Enter at 30-second boot checkpoint", flush=True)
                    for checkpoint in sorted({min(60, seconds), min(120, seconds), seconds}):
                        deadline = started + checkpoint
                        wait_for_checkpoint(process, deadline)
                        status = qmp.command("query-status")
                        screenshot = mode_output / ("screen-%03ds.ppm" % checkpoint)
                        qmp.command("screendump", {"filename": str(screenshot)})
                        with screenshot.open("rb") as image:
                            if image.read(2) != b"P6":
                                raise QMPError("QEMU did not produce the expected PPM screenshot")
                        report["snapshots"].append({
                            "path": str(screenshot), "elapsed_seconds": round(time.monotonic() - started, 1),
                            "qemu_status": status,
                        })
                        print(mode + ": captured " + screenshot.name + "; visual inspection required", flush=True)
                    report["result"] = "snapshots-collected-inspection-required"
                finally:
                    if qmp is not None:
                        try:
                            qmp.command("quit", timeout=3)
                        except (OSError, TimeoutError, QMPError):
                            pass
                        qmp.close()
                    if process is not None:
                        try:
                            process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            process.terminate()
                            try:
                                process.wait(timeout=5)
                            except subprocess.TimeoutExpired:
                                process.kill()
                                process.wait(timeout=5)
                        report["qemu_exit_code_after_cleanup"] = process.returncode
    except Exception as error:
        report["error"] = type(error).__name__ + ": " + str(error)
        print(mode + ": " + report["error"], flush=True)
    finally:
        report["elapsed_seconds"] = round(time.monotonic() - started, 1)
        (mode_output / "capture-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("iso", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--seconds", type=int, default=240, help="Time per firmware, from 31 to 300 seconds; Enter is sent at 30 seconds (default: 240)")
    args = parser.parse_args()
    if not 31 <= args.seconds <= 300:
        parser.error("--seconds must be between 31 and 300 so capture follows the Enter key at 30 seconds")
    iso = args.iso.resolve()
    if not iso.is_file() or iso.stat().st_size == 0:
        parser.error("ISO must be an existing nonempty file")
    qemu = shutil.which("qemu-system-x86_64")
    if qemu is None:
        parser.error("qemu-system-x86_64 is missing; install qemu-system-x86 and ovmf")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    (output / "INSPECTION-REQUIRED.txt").write_text(
        "These are QEMU BIOS and UEFI screen captures, not automated boot pass results.\n"
        "Inspect the final PPM images for the Capsule Corp login screen and boot errors.\n"
        "A running VM or collected screenshot alone does not establish successful boot.\n"
        "Firmware code and ISO are read-only. No target hard disk is attached.\n"
        "Enter is sent once at 30 seconds to select the default live boot menu entry; reports record the input.\n"
        "Serial output may be empty because the ISO uses quiet/splash without a serial console.\n"
        "No physical OBD-II hardware, account login, or Secure Boot was tested.\n",
        encoding="utf-8",
    )
    with ThreadPoolExecutor(max_workers=2) as executor:
        captures = [executor.submit(capture_mode, qemu, iso, output, mode, args.seconds) for mode in ("bios", "uefi")]
        results = [capture.result() for capture in captures]
    (output / "capture-summary.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    return 0 if all(item["result"] == "snapshots-collected-inspection-required" for item in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
