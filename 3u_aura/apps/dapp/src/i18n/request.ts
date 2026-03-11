import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, locales, defaultLocale, type Locale } from "./constants";

export { LOCALE_COOKIE, locales, defaultLocale, type Locale } from "./constants";

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = (store.get(LOCALE_COOKIE)?.value || defaultLocale) as Locale;
  const validLocale = locales.includes(locale) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: {
      Common: (await import(`../../messages/${validLocale}/common.json`)).default,
      Language: (await import(`../../messages/${validLocale}/language.json`)).default,
    },
  };
});
