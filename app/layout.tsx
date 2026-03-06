import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "../styles/globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitLaunchr — Launch tokens on Base",
  description: "A city of GitHub builders. Launch tokens on Base via Bankr — no wallet required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pixelFont.variable}>
      <body>{children}</body>
    </html>
  );
}
