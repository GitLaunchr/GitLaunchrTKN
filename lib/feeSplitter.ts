/**
 * FeeSplitter — compiled ABI + bytecode
 * Solidity source in contracts/FeeSplitter.sol
 *
 * Constructor: (address creatorPayout, address platformTreasury,
 *               uint256 creatorBps, uint256 platformBps)
 * Default split: creatorBps=9000, platformBps=1000 (must sum to 10000)
 *
 * Compile with:
 *   solc --abi --bin --optimize contracts/FeeSplitter.sol
 * or use Foundry:
 *   forge build
 */

// ─── ABI ─────────────────────────────────────────────────────────────
export const FEESPLITTER_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "creatorPayout_",    type: "address" },
      { name: "platformTreasury_", type: "address" },
      { name: "creatorBps_",       type: "uint256" },
      { name: "platformBps_",      type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "distributeETH",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "creatorPayout",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformTreasury",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "creatorBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ETHDistributed",
    inputs: [
      { name: "creator",  type: "uint256", indexed: false },
      { name: "platform", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

/**
 * NOTE: The bytecode below is a PLACEHOLDER.
 * You MUST replace it with the real compiled output from:
 *   forge build  (see contracts/FeeSplitter.sol)
 *   Then copy the hex from out/FeeSplitter.sol/FeeSplitter.json -> bytecode.object
 *
 * The deploy helper below is fully wired up — only the bytecode needs replacing.
 */
export const FEESPLITTER_BYTECODE =
  "0x__REPLACE_WITH_COMPILED_BYTECODE__" as `0x${string}`;
