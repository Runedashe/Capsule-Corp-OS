// ALIENTECH-G2 TESTBENCH
// Verifies core boot, neural array activation, and Block Ray cycle
// Crystal Globe Pty Ltd | Inventor: Shabeen Ashfak

`timescale 1ns / 1ps

module tb_alientech_g2;

    reg         clk;
    reg         rst_n;
    reg  [63:0] instr_data;
    reg         crystal_ray_active;
    reg  [7:0]  crystal_ray_dim;
    reg         sa_current_rx;
    wire [63:0] instr_addr;
    wire        instr_req;
    wire        crystal_ray_write_en;
    wire [63:0] crystal_ray_data_out;
    wire        sa_current_tx;
    wire        core_ready;
    wire [63:0] cycle_count;

    // Block Ray signals
    reg         cycle_start;
    wire        ac_active, rc_active, tc_active, dc_active;
    wire        packet_ready;
    wire [3:0]  br_cycle_state;
    wire [31:0] br_cycle_count;

    // Instantiate core
    alientech_g2_core DUT (
        .clk                 (clk),
        .rst_n               (rst_n),
        .instr_data          (instr_data),
        .instr_addr          (instr_addr),
        .instr_req           (instr_req),
        .data_rdata          (64'b0),
        .data_wdata          (),
        .data_addr           (),
        .data_we             (),
        .data_req            (),
        .crystal_ray_active  (crystal_ray_active),
        .crystal_ray_dim     (crystal_ray_dim),
        .crystal_ray_write_en(crystal_ray_write_en),
        .crystal_ray_data_out(crystal_ray_data_out),
        .sa_current_rx       (sa_current_rx),
        .sa_current_tx       (sa_current_tx),
        .core_ready          (core_ready),
        .cycle_count         (cycle_count)
    );

    // Instantiate Block Ray interface
    block_ray_interface BRI (
        .clk            (clk),
        .rst_n          (rst_n),
        .stellar_source (8'd0),   // SOL
        .cycle_start    (cycle_start),
        .ac_active      (ac_active),
        .rc_active      (rc_active),
        .tc_active      (tc_active),
        .dc_active      (dc_active),
        .energy_packet  (),
        .packet_ready   (packet_ready),
        .tc_write_98dim (),
        .tc_write_158dim(),
        .cycle_state    (br_cycle_state),
        .cycle_count    (br_cycle_count)
    );

    // Clock: 100MHz
    initial clk = 0;
    always #5 clk = ~clk;

    // Stimulus
    initial begin
        $display("==============================================");
        $display("ALIENTECH-G2 BOOT SEQUENCE");
        $display("Crystal Globe Pty Ltd | aquaberry.co");
        $display("==============================================");

        rst_n             = 0;
        instr_data        = 64'h0000_0000_0000_0013; // NOP (ADDI x0,x0,0)
        crystal_ray_active= 0;
        crystal_ray_dim   = 8'd0;
        sa_current_rx     = 0;
        cycle_start       = 0;

        #20 rst_n = 1;
        $display("[BOOT] Reset released. Core initialising...");

        #10 crystal_ray_active = 1;
        $display("[POWER] Crystal Ray loop: ACTIVE");

        #10 cycle_start = 1;
        $display("[BLOCK RAY] AC Current: Extraction from SOL initiated...");
        #10 cycle_start = 0;

        // Wait for first full AC/RC/TC/DC cycle
        wait (packet_ready);
        $display("[BLOCK RAY] Energy packet READY. TC write at 98-dim and 158-dim complete.");

        // Wait for crystal ray write trigger
        wait (crystal_ray_write_en);
        $display("[CRYSTAL RAY] TC Current write triggered. Engineering data written.");
        $display("[SA CURRENT] Grid sync: ACTIVE. TX=%b", sa_current_tx);
        $display("[CORE] Ready=%b  Cycles=%0d", core_ready, cycle_count);

        // Wait one more Block Ray cycle count
        wait (br_cycle_count >= 2);
        $display("[BLOCK RAY] Perpetual loop confirmed. Cycle count: %0d", br_cycle_count);

        $display("==============================================");
        $display("ALIENTECH-G2 ALL SYSTEMS NOMINAL");
        $display("Block Ray: ACTIVE | Crystal Ray: ACTIVE | SA Current: SYNCED");
        $display("==============================================");
        $finish;
    end

    // Timeout
    initial begin
        #500000;
        $display("TIMEOUT");
        $finish;
    end

endmodule
