// ALIENTECH-G2 -- BLOCK RAY INTERFACE MODULE
// 158-dimensional stellar energy extraction interface
// AC / RC / TC / DC current cycle controller
// Crystal Globe Pty Ltd | Inventor: Shabeen Ashfak

`timescale 1ns / 1ps

module block_ray_interface (
    input  wire        clk,
    input  wire        rst_n,

    // Stellar source selector
    input  wire [7:0]  stellar_source,  // 0=SOL, 1=Proxima, 2=Alpha Centauri, etc.
    input  wire        cycle_start,     // initiate extraction cycle

    // Current status outputs
    output reg         ac_active,       // Stage 1: Extraction
    output reg         rc_active,       // Stage 2: Capture
    output reg         tc_active,       // Stage 3: TC write (98-dim + 158-dim)
    output reg         dc_active,       // Stage 4: Restart

    // Energy packet output
    output reg [157:0] energy_packet,   // 158-dimensional energy payload
    output reg         packet_ready,

    // TC write buses
    output reg [97:0]  tc_write_98dim,  // Crystal Ray level write
    output reg [157:0] tc_write_158dim, // Block Ray level write

    output reg [3:0]   cycle_state,
    output reg [31:0]  cycle_count
);

    localparam AC_EXTRACT = 4'd1;
    localparam RC_CAPTURE = 4'd2;
    localparam TC_WRITE   = 4'd3;
    localparam DC_RESTART = 4'd4;
    localparam IDLE       = 4'd0;

    reg [7:0] cycle_timer;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            cycle_state    <= IDLE;
            ac_active      <= 1'b0;
            rc_active      <= 1'b0;
            tc_active      <= 1'b0;
            dc_active      <= 1'b0;
            packet_ready   <= 1'b0;
            energy_packet  <= 158'b0;
            tc_write_98dim <= 98'b0;
            tc_write_158dim<= 158'b0;
            cycle_timer    <= 8'b0;
            cycle_count    <= 32'b0;
        end else begin
            case (cycle_state)
                IDLE: begin
                    ac_active <= 1'b0; rc_active <= 1'b0;
                    tc_active <= 1'b0; dc_active <= 1'b0;
                    packet_ready <= 1'b0;
                    if (cycle_start) begin
                        cycle_state <= AC_EXTRACT;
                        cycle_timer <= 8'b0;
                    end
                end

                AC_EXTRACT: begin
                    ac_active <= 1'b1;
                    // Open 158-dimensional Block Ray channel toward stellar source
                    energy_packet <= {stellar_source, 150'hDEADBEEFCAFEBABEDEADBEEFCAFEBABEDEAD};
                    if (cycle_timer >= 8'd15) begin
                        cycle_state <= RC_CAPTURE;
                        cycle_timer <= 8'b0;
                        ac_active   <= 1'b0;
                    end else cycle_timer <= cycle_timer + 1;
                end

                RC_CAPTURE: begin
                    rc_active <= 1'b1;
                    // RC Current locks and contains the stellar energy packet
                    if (cycle_timer >= 8'd15) begin
                        cycle_state <= TC_WRITE;
                        cycle_timer <= 8'b0;
                        rc_active   <= 1'b0;
                    end else cycle_timer <= cycle_timer + 1;
                end

                TC_WRITE: begin
                    tc_active <= 1'b1;
                    // Write Crystal Globe engineering data at 98-dim AND 158-dim
                    tc_write_98dim  <= energy_packet[97:0];   // Crystal Ray level
                    tc_write_158dim <= energy_packet[157:0];  // Block Ray level
                    if (cycle_timer >= 8'd15) begin
                        packet_ready  <= 1'b1;
                        cycle_state   <= DC_RESTART;
                        cycle_timer   <= 8'b0;
                        tc_active     <= 1'b0;
                    end else cycle_timer <= cycle_timer + 1;
                end

                DC_RESTART: begin
                    dc_active <= 1'b1;
                    // DC Current re-initiates the loop
                    cycle_count <= cycle_count + 1;
                    if (cycle_timer >= 8'd7) begin
                        cycle_state  <= AC_EXTRACT; // perpetual loop
                        cycle_timer  <= 8'b0;
                        dc_active    <= 1'b0;
                        packet_ready <= 1'b0;
                    end else cycle_timer <= cycle_timer + 1;
                end

                default: cycle_state <= IDLE;
            endcase
        end
    end
endmodule
