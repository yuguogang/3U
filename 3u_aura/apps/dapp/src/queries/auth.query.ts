import { z } from "zod";
import {
  type AuthSignatureSigninInput,
  AuthSignatureMessageSchema,
} from "3u-aura-common";
import {
  apiAuthGetSignatureMessage,
  apiAuthSigninBySignature,
} from "../api/auth";
import { useMutation } from "@tanstack/react-query";

type AuthSignatureMessageInput = z.infer<typeof AuthSignatureMessageSchema>;

export function useAuthSignatureMessageMutation() {
  return useMutation({
    mutationKey: ["signature_message"],
    mutationFn: (data: AuthSignatureMessageInput) =>
      apiAuthGetSignatureMessage(data),
  });
}

export function useAuthSigninBySignatureMutation() {
  return useMutation({
    mutationKey: ["signature_signin"],
    mutationFn: (data: AuthSignatureSigninInput) =>
      apiAuthSigninBySignature(data),
  });
}
