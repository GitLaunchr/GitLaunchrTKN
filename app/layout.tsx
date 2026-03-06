import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import SessionWrapper from "@/app/components/SessionWrapper";
import "@/styles/globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitLaunchr",
  description:
    "A city of GitHub builders. Launch tokens via Bankr Agent API.",
  openGraph: {
    title: "GitLaunchr",
    description: "Launch tokens on Base.",
    siteName: "GitLaunchr",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
