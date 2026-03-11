"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, createContext, useContext } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useSetLocale, type Locale } from "@/i18n/locale-actions";
import { languages } from "@/i18n/languages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { WalletButton } from "@/components/wallet-button";

// Menu Context
const MenuContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => { } });

export function useMenu() {
  return useContext(MenuContext);
}

// Language Context (syncs with next-intl via cookie)
const LanguageContext = createContext<{
  language: Locale;
  setLanguage: (lang: Locale) => void;
}>({ language: "zh", setLanguage: () => { } });

export function useLanguage() {
  return useContext(LanguageContext);
}

// 语言切换弹窗
function LanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations("Language");
  const setLocale = useSetLocale();

  const handleSetLanguage = (lang: Locale) => {
    setLanguage(lang);
    setLocale(lang);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[300px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[20px] border-white/10 bg-[rgba(30,30,30,0.95)] p-0 shadow-[0px_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-[20px]"
      >
        {/* 标题 */}
        <DialogHeader className="flex-row items-center justify-between gap-0 border-b border-white/10 px-5 py-4">
          <DialogTitle className="text-base font-semibold text-white">
            {t("title")}
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </DialogClose>
        </DialogHeader>

        {/* 语言列表 */}
        <div className="p-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSetLanguage(lang.code)}
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all",
                language === lang.code
                  ? "bg-linear-to-r from-orange-500/20 to-transparent"
                  : "hover:bg-white/5"
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  language === lang.code ? "text-orange-400" : "text-white/80"
                )}
              >
                {lang.label}
              </span>
              {language === lang.code && (
                <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#FA2B15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 语言切换按钮
function LanguageButton({ onClick }: { onClick: () => void }) {
  const { language } = useLanguage();
  const currentLang = languages.find(l => l.code === language);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" />
        <path d="M2 12H22" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" />
        <path d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" />
      </svg>
      <span className="text-white/80 font-medium text-lg">{currentLang?.flag}</span>
    </button>
  );
}

// 菜单项数据
const menuItems = [
  { href: "/", labelKey: "nav.home" as const, icon: "home" },
  { href: "/swap", labelKey: "nav.swap" as const, icon: "swap" },
  { href: "/products", labelKey: "nav.products" as const, icon: "subscribe" },
  { href: "/loan", labelKey: "nav.loan" as const, icon: "loan" },
  { href: "/redeem", labelKey: "nav.redeem" as const, icon: "redeem" },
  { href: "/share", labelKey: "nav.share" as const, icon: "share" },
  { href: "/manage", labelKey: "nav.manage" as const, icon: "manage" },
  { href: "/binding", labelKey: "nav.binding" as const, icon: "binding" },
];

// 导航菜单弹窗
function NavMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const setLocale = useSetLocale();
  const [showLangList, setShowLangList] = useState(false);
  const currentLang = languages.find(l => l.code === language);
  const t = useTranslations("Common");

  const handleSetLanguageFromNav = (lang: Locale) => {
    setLanguage(lang);
    setLocale(lang);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex max-w-[85vw] flex-col gap-0 overflow-y-auto border-white/10 bg-black/95 p-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        {/* 关闭按钮 */}
        <SheetClose asChild>
          <button
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </SheetClose>

        {/* Logo */}
        <div className="mb-6 px-6 pt-6">
          <Image
            src="/images/logo.png"
            alt="RAN Logo"
            width={80}
            height={32}
            className="object-contain"
          />
        </div>

        {/* 语言切换区域 */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowLangList(!showLangList)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <path d="M2 12H22" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <path d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
            </svg>
            <span className="text-white/80 text-sm font-medium flex-1 text-left">
              {currentLang?.flag} {currentLang?.label}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={cn("transition-transform", showLangList && "rotate-180")}
            >
              <path d="M6 9L12 15L18 9" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 语言列表 */}
          {showLangList && (
            <div className="mt-2 rounded-xl bg-white/5 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    handleSetLanguageFromNav(lang.code);
                    setShowLangList(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 transition-all",
                    language === lang.code
                      ? "bg-orange-500/20 text-orange-400"
                      : "text-white/70 hover:bg-white/5"
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                  {language === lang.code && (
                    <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="#FA2B15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="mx-4 border-t border-white/10 mb-4" />

        {/* 菜单列表 */}
        <nav className="px-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl mb-1 transition-all",
                  isActive
                    ? "bg-linear-to-r from-orange-500/20 to-transparent text-orange-400"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <MenuIcon name={item.icon} active={isActive} />
                <span className="text-base font-medium">{t(item.labelKey)}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// 菜单图标
function MenuIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "#FA2B15" : "rgba(255,255,255,0.7)";

  switch (name) {
    case "home":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22V12H15V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "swap":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M7 16L3 12L7 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 8L21 12L17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "subscribe":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "loan":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
          <path d="M2 10H22" stroke={color} strokeWidth="2" />
          <path d="M6 15H10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "redeem":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 10L12 15L17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "share":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
          <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
          <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
          <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "manage":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={color} strokeWidth="2" />
          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.896 4.29 19.71C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "binding":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33397 21.9434 7.02299C21.932 5.71201 21.4061 4.45794 20.4791 3.5309C19.5521 2.60386 18.298 2.07802 16.987 2.06663C15.676 2.05523 14.413 2.55921 13.47 3.47L11.75 5.18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7642 9.26331 11.0684 9.05889 10.3533 9.00768C9.63816 8.95646 8.92037 9.05964 8.24861 9.31023C7.57685 9.56082 6.96684 9.95294 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

// 导航栏组件
export function NavBar({
  transparent = false,
  onMenuClick,
  onLanguageClick
}: {
  transparent?: boolean;
  onMenuClick?: () => void;
  onLanguageClick?: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-[13px] h-12",
      transparent ? "bg-transparent" : "bg-black"
    )}>
      <Link href="/">
        <Image
          src="/images/logo.png"
          alt="RAN Logo"
          width={63}
          height={25}
          className="object-contain"
        />
      </Link>
      <div className="flex items-center gap-2">

        <WalletButton />
        {/* 语言切换按钮 */}
        <LanguageButton onClick={onLanguageClick || (() => { })} />
        {/* Menu 图标 */}
        <button onClick={onMenuClick} className="hover:opacity-80 transition-opacity">
          <Image src="/images/menu-icon.svg" alt="Menu" width={24} height={24} />
        </button>
      </div>
    </div>
  );
}

// 底部导航栏
const navItems = [
  { href: "/", labelKey: "nav.home" as const, icon: "home" },
  { href: "/swap", labelKey: "nav.swap" as const, icon: "swap" },
  { href: "/products", labelKey: "nav.products" as const, icon: "subscribe" },
  { href: "/share", labelKey: "nav.share" as const, icon: "share" },
  { href: "/manage", labelKey: "nav.manage" as const, icon: "manage" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("Common");

  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto bg-black/90 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                isActive ? "text-orange-500" : "text-white/60 hover:text-white/80"
              )}
            >
              <NavIcon name={item.icon} active={isActive} />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "#FA2B15" : "rgba(255,255,255,0.6)";

  switch (name) {
    case "home":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22V12H15V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "swap":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M7 16L3 12L7 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 8L21 12L17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "subscribe":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "share":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
          <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
          <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
          <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "manage":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={color} strokeWidth="2" />
          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

// 玻璃卡片组件
export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-[16px] overflow-hidden", className)}
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0px 20px 25px 0px rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(60px)",
      }}
    >
      {children}
    </div>
  );
}

// 渐变按钮组件
export function GradientButton({
  children,
  className,
  onClick,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-[26px] px-4 text-xs",
    md: "h-[44px] px-6 text-base",
    lg: "h-[52px] px-8 text-lg",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[30px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]",
        sizeClasses[size],
        className
      )}
      style={{
        background: "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
      }}
    >
      {children}
    </button>
  );
}

// 移动端布局包装器
export function MobileLayout({
  children,
  showNav = true,
  showBottomNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
  showBottomNav?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const localeFromIntl = useLocale() as Locale;
  const [language, setLanguage] = useState<Locale>(localeFromIntl);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <MenuContext.Provider value={{ isOpen: menuOpen, setIsOpen: setMenuOpen }}>
        <div className="min-h-screen mx-auto relative">
          {showNav && (
            <NavBar
              onMenuClick={() => setMenuOpen(true)}
              onLanguageClick={() => setLanguageOpen(true)}
            />
          )}
          <main className={cn(showBottomNav && "pb-24")}>{children}</main>
          {showBottomNav && <BottomNav />}
          <NavMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          <LanguageModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
        </div>
      </MenuContext.Provider>
    </LanguageContext.Provider>
  );
}
