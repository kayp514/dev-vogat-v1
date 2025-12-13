import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CallSIPProvider } from "./providers/CallSipProvider";
import { SIPProvider } from "./providers/SipProvider";
import { TernSecureProvider } from "@tern-secure/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "./providers/QueryProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <TernSecureProvider
            appCheck={{
              provider: "reCaptchaV3",
              siteKey: "6LfzGRgsAAAAAGEvbwbcLgT4IHWmuWv4kEDRA5hi",
              isTokenAutoRefreshEnabled: true,
            }}
            //apiUrl="ternsecure-auth-admin.vercel.app"
            ternUIUrl="https://cdn.jsdelivr.net/npm/@tern-secure/auth@1.1.0-canary.v20251210182014/dist/ternsecure.browser.js"
            persistence="local"
            requiresVerification={false}
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
                  <SpeedInsights />
                </CallSIPProvider>
              </SIPProvider>
            </ThemeProvider>
          </TernSecureProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
