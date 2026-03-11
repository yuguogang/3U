import {
  type AuthSignatureMessageInput,
  type AuthSignatureSigninInput,
} from "3u-aura-common";
import {
  apiAuthGetSignatureMessage,
  apiAuthSigninBySignature,
} from "../api/auth";
import { useMutation } from "@tanstack/react-query";

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
