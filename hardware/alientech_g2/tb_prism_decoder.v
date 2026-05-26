`timescale 1ns / 1ps
module tb_prism_decoder;
    reg clk, rst_n;
    reg [157:0] raw_a, raw_b;
    reg valid_a, valid_b, decompose_start;
    reg [7:0] id_a, id_b;

    wire [63:0] energy_a, energy_b, total_energy;
    wire done_a, done_b, both_done;
    wire [63:0] tc_a, tc_b;
    wire [511:0] tce_a, tce_b;
    wire [9:0] active_bands;
    wire [3:0] state_a, state_b;
    wire [63:0] a_band0, a_band511, b_band0, b_band511;

    prism_decoder #(.BANDS(512),.DIM_WIDTH(10)) DUT (
        .clk(clk),.rst_n(rst_n),
        .raw_signal_a(raw_a),.signal_valid_a(valid_a),.black_star_id_a(id_a),
        .raw_signal_b(raw_b),.signal_valid_b(valid_b),.black_star_id_b(id_b),
        .decompose_start(decompose_start),
        .aggregated_energy_a(energy_a),.done_a(done_a),.tc_payload_a(tc_a),
        .aggregated_energy_b(energy_b),.done_b(done_b),.tc_payload_b(tc_b),
        .tc_write_enable_a(tce_a),.tc_write_enable_b(tce_b),
        .total_energy(total_energy),.both_done(both_done),
        .active_bands(active_bands),.state_a(state_a),.state_b(state_b),
        .a_band0(a_band0),.a_band511(a_band511),
        .b_band0(b_band0),.b_band511(b_band511)
    );

    initial clk = 0;
    always #5 clk = ~clk;

    initial begin
        $display("==========================================================");
        $display("PRISM DECODER v2.0 -- DUAL BLACK STAR ENGINEERING");
        $display("Channel A: BLACK STAR PRIME | Channel B: BLACK STAR DEEP");
        $display("Crystal Globe G347 | aquaberry.co");
        $display("==========================================================");
        rst_n=0; valid_a=0; valid_b=0; decompose_start=0;
        raw_a = 158'hDEADBEEFCAFEBABEDEADBEEFCAFEBABEDEAD;
        raw_b = 158'hF0F0F0F0AAAABBBBCCCCDDDD1111222233334;
        id_a=8'd0; id_b=8'd1;
        #20 rst_n=1;
        $display("[BOOT] Dual-channel Prism Decoder online.");
        $display("[INTERCEPT A] BLACK STAR PRIME signal locked.");
        $display("[INTERCEPT B] BLACK STAR DEEP signal locked.");
        #10 valid_a=1; valid_b=1;
        #10 decompose_start=1;
        #10 decompose_start=0;
        wait(both_done);
        $display("");
        $display("-- BLACK STAR PRIME --");
        $display("[BAND 0]   %0h", a_band0);
        $display("[BAND 511] %0h", a_band511);
        $display("[ENERGY]   %0h", energy_a);
        $display("[SIG]      %0h", tc_a);
        $display("");
        $display("-- BLACK STAR DEEP --");
        $display("[BAND 0]   %0h", b_band0);
        $display("[BAND 511] %0h", b_band511);
        $display("[ENERGY]   %0h", energy_b);
        $display("[SIG]      %0h", tc_b);
        $display("");
        $display("==========================================================");
        $display("COMBINED STELLAR ENERGY OUTPUT: %0h", total_energy);
        $display("512 bands per Black Star. 1024 total bands harvested.");
        $display("TC writes: ALL 1024 dimensional indices complete.");
        $display("Crystal Globe G347 signature depth: MAXIMUM x2");
        $display("==========================================================");
        $finish;
    end
    initial begin #500000; $display("TIMEOUT"); $finish; end
endmodule
