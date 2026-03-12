import { z } from "zod";
import { fetchClient } from "@/lib/fetch.client";
import {
  type AuthSignatureSigninInput,
  AuthSignatureMessageSchema,
} from "3u-aura-common";

type AuthSignatureMessageInput = z.infer<typeof AuthSignatureMessageSchema>;

export type AuthSignatureMessageResponse = {
  message: string;
  expired: number;
};

export type AuthSignatureSigninResponse = {
  accessToken: string;
  accessTokenExpired: number;
};

export async function apiAuthGetSignatureMessage(
  data: AuthSignatureMessageInput,
) {
  const response = await fetchClient<AuthSignatureMessageResponse>(
    `/api/v1/auth/signature_message`,
    {
      method: "GET",
      query: data,
    },
  );
  return response;
}

export async function apiAuthSigninBySignature(body: AuthSignatureSigninInput) {
  const response = await fetchClient<AuthSignatureSigninResponse>(
    `/api/v1/auth/signature_signin`,
    {
      method: "POST",
      // 接收服务端写入的 httpOnly refresh_token Cookie
      // credentials: "include",
      body,
    },
  );
  return response;
}
