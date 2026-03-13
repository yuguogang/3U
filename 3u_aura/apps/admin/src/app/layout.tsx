import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Web3Provider } from "@/components/providers/web3-provider";

export const metadata: Metadata = {
  title: "3U AURA Admin Console",
  description: "Admin and operator console for 3U AURA promotion operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryProvider>
          <Web3Provider>{children}</Web3Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
