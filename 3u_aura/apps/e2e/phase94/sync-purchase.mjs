import { privateKeyToAccount } from "viem/accounts";

const USER_A_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const USER_A_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const SERVER_URL = "http://127.0.0.1:3210";
const TX_HASH = process.argv[2];

if (!TX_HASH) {
  console.error("Usage: node sync-purchase.mjs <txHash>");
  process.exit(1);
}

async function getSigninMessage(address) {
  const url = new URL("/api/v1/auth/signature_message", SERVER_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("scenario", "SIGNIN");
  const res = await fetch(url.toString());
  return res.json();
}

async function signin(address, privateKey) {
  const { message } = await getSigninMessage(address);
  const account = privateKeyToAccount(privateKey);
  const signature = await account.signMessage({ message });

  const res = await fetch(new URL("/api/v1/auth/signature_signin", SERVER_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      chain: 97,
      device: "BROWSER",
      name: "MetaMask",
      signature,
    }),
  });
  return res.json();
}

async function syncPurchase(token, txHash) {
  const res = await fetch(new URL("/api/v1/claims/purchased-nft/sync", SERVER_URL).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ txHash }),
  });
  return res.json();
}

async function run() {
  try {
    console.log("Logging in as userA...");
    const { accessToken } = await signin(USER_A_ADDRESS, USER_A_PRIVATE_KEY);
    console.log("Access token obtained.");

    console.log(`Syncing purchase for txHash: ${TX_HASH}...`);
    const result = await syncPurchase(accessToken, TX_HASH);
    console.log("Sync result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
