import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { FEESPLITTER_ABI, FEESPLITTER_BYTECODE } from "./feeSplitter";

// ── Base mainnet ────────────────────────────────────────────────────
const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: { http: [process.env.BASE_RPC_URL ?? "https://mainnet.base.org"] },
  },
  blockExplorers: {
    default: { name: "Basescan", url: "https://basescan.org" },
  },
});

function getClients() {
  const pk = process.env.PLATFORM_DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Missing PLATFORM_DEPLOYER_PRIVATE_KEY");

  const account = privateKeyToAccount(pk as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL),
  });

  return { walletClient, publicClient, account };
}

/**
 * Deploy a FeeSplitter contract on Base.
 * Returns the deployed contract address.
 */
export async function deployFeeSplitter(
  creatorPayout: `0x${string}`,
  creatorBps = BigInt(9000),
  platformBps = BigInt(1000)
): Promise<`0x${string}`> {
  const treasury = process.env.PLATFORM_TREASURY_ADDRESS as `0x${string}`;
  if (!treasury) throw new Error("Missing PLATFORM_TREASURY_ADDRESS");

  if (FEESPLITTER_BYTECODE === "0x__REPLACE_WITH_COMPILED_BYTECODE__") {
    throw new Error(
      "FeeSplitter bytecode not compiled yet. Run `forge build` and update lib/feeSplitter.ts."
    );
  }

  const { walletClient, publicClient } = getClients();

  // Deploy contract
  const hash = await walletClient.deployContract({
    abi: FEESPLITTER_ABI,
    bytecode: FEESPLITTER_BYTECODE,
    args: [creatorPayout, treasury, creatorBps, platformBps],
  });

  // Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error(`Deploy tx confirmed but no contractAddress. hash=${hash}`);
  }

  return receipt.contractAddress;
}