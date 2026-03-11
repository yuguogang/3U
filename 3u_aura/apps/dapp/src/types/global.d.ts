import type en from "../../messages/en/common.json";
import type enLanguage from "../../messages/en/language.json";

type Messages = {
  Common: typeof en;
  Language: typeof enLanguage;
};

declare module "next-intl" {
  interface AppMessages extends Messages {}
}
