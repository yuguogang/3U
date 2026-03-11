"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./constants";

export { type Locale } from "./constants";

export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
}

export function useSetLocale() {
  const router = useRouter();
  return (locale: Locale) => {
    setLocaleCookie(locale);
    router.refresh();
  };
}
