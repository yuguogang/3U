import { z } from "zod";
import type {
  AdminSessionView,
  AuthSignatureSigninInput,
} from "3u-aura-common";
import {
  AuthSignatureMessageSchema,
  DEVICES,
  SignatureScenarios,
} from "3u-aura-common";
import { fetchClient } from "@/lib/fetch.client";

type AuthSignatureMessageInput = z.infer<typeof AuthSignatureMessageSchema>;

export interface AdminSignatureLoginResponse {
  accessToken: string;
  accessTokenExpired: number;
  user: AdminSessionView["user"];
}

export interface AuthSignatureMessageResponse {
  expired: number;
  message: string;
}

export async function apiGetSignatureMessage(
  data: AuthSignatureMessageInput = {
    address: "",
    scenario: SignatureScenarios.SIGNIN,
  },
) {
  return fetchClient<AuthSignatureMessageResponse>(
    "/api/v1/auth/signature_message",
    {
      auth: false,
      method: "GET",
      query: data,
    },
  );
}

export async function apiAdminSigninBySignature(
  body: AuthSignatureSigninInput,
) {
  return fetchClient<AdminSignatureLoginResponse>("/api/v1/admin/auth/login", {
    auth: false,
    credentials: "include",
    body: {
      ...body,
      device: body.device || DEVICES.BROWSER,
    },
    method: "POST",
  });
}

export async function apiAdminMe() {
  return fetchClient<AdminSessionView>("/api/v1/admin/auth/me");
}

export async function apiAdminLogout() {
  return fetchClient<{ success: boolean }>("/api/v1/admin/auth/logout", {
    credentials: "include",
    method: "POST",
  });
}
