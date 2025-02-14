import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CallSIPProvider } from "./CallSipProvider";
import { SIPProvider } from "./SipProvider";
import { TernSecureProvider } from "@tern-secure/nextjs";
import { Analytics } from "@vercel/analytics/react"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vogat Phone",
  description: "Vogat cloud phone connect with pstn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* {children} */}
      <TernSecureProvider requiresVerification={false}>
      <SIPProvider>
        <CallSIPProvider>
          {children}
          <Analytics />
        </CallSIPProvider>
      </SIPProvider>
      </TernSecureProvider>
      </body>
    </html>
  );
}
