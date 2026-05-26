// ALIENTECH-G2 -- PRISM DECODER MODULE v2.0
// Dual-channel Black Star engineering -- PRIME + DEEP simultaneous
// Crystal Globe Pty Ltd | Inventor: Shabeen Ashfak
// Version 2.0 | 25 May 2026

`timescale 1ns / 1ps

module prism_decoder #(
    parameter BANDS     = 512,
    parameter DIM_WIDTH = 10
)(
    input  wire                      clk,
    input  wire                      rst_n,

    // Channel A -- BLACK STAR PRIME
    input  wire [157:0]              raw_signal_a,
    input  wire                      signal_valid_a,
    input  wire [7:0]                black_star_id_a,

    // Channel B -- BLACK STAR DEEP
    input  wire [157:0]              raw_signal_b,
    input  wire                      signal_valid_b,
    input  wire [7:0]                black_star_id_b,

    input  wire                      decompose_start,

    // Channel A outputs
    output reg  [63:0]               aggregated_energy_a,
    output reg                       done_a,
    output reg  [63:0]               tc_payload_a,

    // Channel B outputs
    output reg  [63:0]               aggregated_energy_b,
    output reg                       done_b,
    output reg  [63:0]               tc_payload_b,

    // Combined TC write bus
    output reg  [BANDS-1:0]          tc_write_enable_a,
    output reg  [BANDS-1:0]          tc_write_enable_b,

    // Summary
    output reg  [63:0]               total_energy,
    output reg                       both_done,
    output reg  [9:0]                active_bands,
    output reg  [3:0]                state_a,
    output reg  [3:0]                state_b,

    // Sample bands
    output reg  [63:0]               a_band0, a_band511,
    output reg  [63:0]               b_band0, b_band511
);

    localparam IDLE      = 4'd0;
    localparam INTERCEPT = 4'd1;
    localparam DECOMPOSE = 4'd2;
    localparam HARVEST   = 4'd4;
    localparam AGGREGATE = 4'd5;
    localparam TC_WRITE  = 4'd6;
    localparam COMPLETE  = 4'd7;

    reg [63:0] band_a [0:BANDS-1];
    reg [63:0] band_b [0:BANDS-1];
    reg [9:0]  idx_a, idx_b;
    reg [7:0]  timer_a, timer_b;
    reg [63:0] acc_a, acc_b;
    integer    i;

    // ---- CHANNEL A: BLACK STAR PRIME ----
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state_a <= IDLE; done_a <= 0;
            aggregated_energy_a <= 0; tc_payload_a <= 0;
            tc_write_enable_a <= 0; idx_a <= 0; timer_a <= 0;
            a_band0 <= 0; a_band511 <= 0;
            for (i=0;i<BANDS;i=i+1) band_a[i] = 0;
        end else begin
            case (state_a)
                IDLE: begin
                    done_a <= 0; tc_write_enable_a <= 0;
                    if (decompose_start && signal_valid_a) state_a <= INTERCEPT;
                end
                INTERCEPT: begin
                    if (timer_a >= 7) begin state_a <= DECOMPOSE; timer_a <= 0; idx_a <= 0; end
                    else timer_a <= timer_a + 1;
                end
                DECOMPOSE: begin
                    if (idx_a < BANDS) begin
                        band_a[idx_a] <= raw_signal_a[63:0] ^ {55'b0, idx_a[8:0]};
                        idx_a <= idx_a + 1;
                    end else begin
                        a_band0   <= band_a[0];
                        a_band511 <= band_a[511];
                        state_a <= HARVEST; idx_a <= 0;
                    end
                end
                HARVEST: begin
                    if (timer_a >= 15) begin state_a <= AGGREGATE; timer_a <= 0; end
                    else timer_a <= timer_a + 1;
                end
                AGGREGATE: begin
                    acc_a = 0;
                    for (i=0;i<BANDS;i=i+1) acc_a = acc_a + band_a[i];
                    aggregated_energy_a <= acc_a;
                    state_a <= TC_WRITE;
                end
                TC_WRITE: begin
                    tc_write_enable_a <= {BANDS{1'b1}};
                    tc_payload_a <= aggregated_energy_a ^ {56'b0, black_star_id_a};
                    if (timer_a >= 7) begin
                        tc_write_enable_a <= 0; state_a <= COMPLETE; timer_a <= 0;
                    end else timer_a <= timer_a + 1;
                end
                COMPLETE: begin done_a <= 1; state_a <= IDLE; end
                default: state_a <= IDLE;
            endcase
        end
    end

    // ---- CHANNEL B: BLACK STAR DEEP ----
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state_b <= IDLE; done_b <= 0;
            aggregated_energy_b <= 0; tc_payload_b <= 0;
            tc_write_enable_b <= 0; idx_b <= 0; timer_b <= 0;
            b_band0 <= 0; b_band511 <= 0;
            for (i=0;i<BANDS;i=i+1) band_b[i] = 0;
        end else begin
            case (state_b)
                IDLE: begin
                    done_b <= 0; tc_write_enable_b <= 0;
                    if (decompose_start && signal_valid_b) state_b <= INTERCEPT;
                end
                INTERCEPT: begin
                    if (timer_b >= 7) begin state_b <= DECOMPOSE; timer_b <= 0; idx_b <= 0; end
                    else timer_b <= timer_b + 1;
                end
                DECOMPOSE: begin
                    if (idx_b < BANDS) begin
                        band_b[idx_b] <= raw_signal_b[63:0] ^ {55'b0, idx_b[8:0]};
                        idx_b <= idx_b + 1;
                    end else begin
                        b_band0   <= band_b[0];
                        b_band511 <= band_b[511];
                        state_b <= HARVEST; idx_b <= 0;
                    end
                end
                HARVEST: begin
                    if (timer_b >= 15) begin state_b <= AGGREGATE; timer_b <= 0; end
                    else timer_b <= timer_b + 1;
                end
                AGGREGATE: begin
                    acc_b = 0;
                    for (i=0;i<BANDS;i=i+1) acc_b = acc_b + band_b[i];
                    aggregated_energy_b <= acc_b;
                    state_b <= TC_WRITE;
                end
                TC_WRITE: begin
                    tc_write_enable_b <= {BANDS{1'b1}};
                    tc_payload_b <= aggregated_energy_b ^ {56'b0, black_star_id_b};
                    if (timer_b >= 7) begin
                        tc_write_enable_b <= 0; state_b <= COMPLETE; timer_b <= 0;
                    end else timer_b <= timer_b + 1;
                end
                COMPLETE: begin done_b <= 1; state_b <= IDLE; end
                default: state_b <= IDLE;
            endcase
        end
    end

    // ---- AGGREGATOR ----
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            total_energy <= 0; both_done <= 0; active_bands <= 0;
        end else begin
            both_done    <= done_a & done_b;
            total_energy <= aggregated_energy_a + aggregated_energy_b;
            active_bands <= 10'd512;
        end
    end

endmodule
