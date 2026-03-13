"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { AuthSignatureSigninInput } from "3u-aura-common";
import { AuthSignatureMessageSchema } from "3u-aura-common";
import {
  apiAdminLogout,
  apiAdminMe,
  apiAdminSigninBySignature,
  apiGetSignatureMessage,
} from "@/api/auth";

type AuthSignatureMessageInput = z.infer<typeof AuthSignatureMessageSchema>;

export function useSignatureMessageMutation() {
  return useMutation({
    mutationFn: (data: AuthSignatureMessageInput) => apiGetSignatureMessage(data),
    mutationKey: ["admin", "auth", "signature-message"],
  });
}

export function useAdminSigninMutation() {
  return useMutation({
    mutationFn: (data: AuthSignatureSigninInput) => apiAdminSigninBySignature(data),
    mutationKey: ["admin", "auth", "signin"],
  });
}

export function useAdminLogoutMutation() {
  return useMutation({
    mutationFn: apiAdminLogout,
    mutationKey: ["admin", "auth", "logout"],
  });
}

export function useAdminMeQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: apiAdminMe,
    queryKey: ["admin", "auth", "me"],
  });
}
