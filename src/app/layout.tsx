import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CallSIPProvider } from "./providers/CallSipProvider";
import { SIPProvider } from "./providers/SipProvider";
import { TernSecureProvider } from "@tern-secure/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";

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
        <TernSecureProvider
          requiresVerification={false}
          persistence="browserCookie"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SIPProvider>
              <CallSIPProvider>
                {children}
                <Analytics />
              </CallSIPProvider>
            </SIPProvider>
          </ThemeProvider>
        </TernSecureProvider>
      </body>
    </html>
  );
}
