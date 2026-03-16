import type { Page } from "@playwright/test";
import { privateKeyToAccount } from "viem/accounts";
import type { WalletFixture } from "./runtime";
import { loadRuntimeConfig } from "./runtime";

type SignatureMessageResponse = {
  expired: number;
  message: string;
};

type DappSigninResponse = {
  accessToken: string;
  accessTokenExpired: number;
};

type AdminSigninResponse = DappSigninResponse & {
  user: unknown;
};

type PersistedStore = {
  state: Record<string, unknown>;
  version: number;
};

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} (${input})`,
    );
  }

  return (await response.json()) as T;
}

async function getSigninMessage(address: `0x${string}`) {
  const runtime = loadRuntimeConfig();
  const url = new URL(
    "/api/v1/auth/signature_message",
    runtime.manifest.infra.server.publicApiBaseUrl,
  );
  url.searchParams.set("address", address);
  url.searchParams.set("scenario", "SIGNIN");

  return requestJson<SignatureMessageResponse>(url.toString());
}

async function signMessage(wallet: WalletFixture, message: string) {
  const account = privateKeyToAccount(wallet.privateKey);
  return account.signMessage({ message });
}

async function signinDapp(wallet: WalletFixture) {
  const runtime = loadRuntimeConfig();
  const { message } = await getSigninMessage(wallet.address);
  const signature = await signMessage(wallet, message);

  return requestJson<DappSigninResponse>(
    new URL(
      "/api/v1/auth/signature_signin",
      runtime.manifest.infra.server.publicApiBaseUrl,
    ).toString(),
    {
      body: JSON.stringify({
        address: wallet.address,
        chain: wallet.chainId,
        device: "BROWSER",
        name: wallet.name,
        signature,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    },
  );
}

async function signinAdmin(wallet: WalletFixture) {
  const runtime = loadRuntimeConfig();
  const { message } = await getSigninMessage(wallet.address);
  const signature = await signMessage(wallet, message);

  return requestJson<AdminSigninResponse>(
    new URL(
      "/api/v1/admin/auth/login",
      runtime.manifest.infra.server.publicApiBaseUrl,
    ).toString(),
    {
      body: JSON.stringify({
        address: wallet.address,
        chain: wallet.chainId,
        device: "BROWSER",
        name: wallet.name,
        signature,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    },
  );
}

async function seedPersistedStore(
  page: Page,
  storageKey: string,
  store: PersistedStore,
) {
  await page.addInitScript(
    ({ nextStore, nextStorageKey }) => {
      window.localStorage.setItem(
        nextStorageKey,
        JSON.stringify(nextStore),
      );
    },
    {
      nextStorageKey: storageKey,
      nextStore: store,
    },
  );
}

export async function bootstrapDappSession(page: Page, wallet: WalletFixture) {
  const signin = await signinDapp(wallet);

  await seedPersistedStore(page, "auth-store", {
    state: {
      accessToken: signin.accessToken,
      authAddress: wallet.address,
      isAuthenticated: true,
      user: null,
    },
    version: 0,
  });

  return signin;
}

export async function bootstrapAdminSession(page: Page, wallet: WalletFixture) {
  const signin = await signinAdmin(wallet);

  await seedPersistedStore(page, "admin-auth-store", {
    state: {
      accessToken: signin.accessToken,
      authAddress: wallet.address,
      isAuthenticated: true,
      user: signin.user,
    },
    version: 0,
  });

  return signin;
}
