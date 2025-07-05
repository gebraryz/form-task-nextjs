import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { FC, PropsWithChildren } from "react";
import "./globals.css";

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Formularz rekrutacyjny",
};

const Layout: FC<PropsWithChildren> = ({ children }) => (
  <html lang="pl" className={interFont.variable}>
    <body>
      <main>{children}</main>
      <Toaster richColors />
    </body>
  </html>
);

export default Layout;
