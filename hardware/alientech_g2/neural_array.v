// ALIENTECH-G2 -- 512-CORE NEURAL PROCESSING ARRAY
// Crystal Globe Pty Ltd | Inventor: Shabeen Ashfak
// Each neural core handles one dimensional slice of the Crystal Ray framework

`timescale 1ns / 1ps

module neural_core (
    input  wire        clk,
    input  wire        rst_n,
    input  wire [63:0] data_in,
    input  wire [8:0]  core_id,       // 0-511
    input  wire        activate,
    output reg  [63:0] data_out,
    output reg         done
);
    reg [63:0] accumulator;
    reg [3:0]  state;

    localparam IDLE     = 4'd0;
    localparam LOAD     = 4'd1;
    localparam COMPUTE  = 4'd2;
    localparam WRITE    = 4'd3;
    localparam COMPLETE = 4'd4;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            accumulator <= 64'b0;
            data_out    <= 64'b0;
            done        <= 1'b0;
            state       <= IDLE;
        end else begin
            case (state)
                IDLE:     if (activate) state <= LOAD;
                LOAD:     begin accumulator <= data_in; state <= COMPUTE; end
                COMPUTE:  begin
                    // Neural activation -- weighted sum with core_id as bias
                    accumulator <= accumulator + {55'b0, core_id};
                    state <= WRITE;
                end
                WRITE:    begin
                    data_out <= accumulator;
                    done     <= 1'b1;
                    state    <= COMPLETE;
                end
                COMPLETE: begin done <= 1'b0; state <= IDLE; end
                default:  state <= IDLE;
            endcase
        end
    end
endmodule

// 512-core array instantiation (parameterised)
module neural_array #(parameter CORES = 512) (
    input  wire          clk,
    input  wire          rst_n,
    input  wire [63:0]   data_in,
    input  wire          activate_all,
    output wire [63:0]   aggregated_out,
    output wire          array_done
);
    wire [63:0] core_out [0:CORES-1];
    wire        core_done[0:CORES-1];
    reg  [63:0] agg;
    integer j;

    genvar k;
    generate
        for (k = 0; k < CORES; k = k + 1) begin : neural_cores
            neural_core nc (
                .clk      (clk),
                .rst_n    (rst_n),
                .data_in  (data_in),
                .core_id  (k[8:0]),
                .activate (activate_all),
                .data_out (core_out[k]),
                .done     (core_done[k])
            );
        end
    endgenerate

    // Aggregate all core outputs
    always @(posedge clk) begin
        agg = 64'b0;
        for (j = 0; j < CORES; j = j + 1)
            agg = agg ^ core_out[j]; // XOR reduction across all 512 cores
    end

    assign aggregated_out = agg;
    assign array_done     = &core_done; // all cores done
endmodule
