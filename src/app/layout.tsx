import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { FontSizeProvider } from "@/lib/font-size-context";

export const metadata: Metadata = {
  title: "JanSahayak — Cooperative Gig Services",
  description: "SIH26089 prototype — Cooperative Gig Platform with Rotational Equity",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var size = localStorage.getItem('jansahayak_font_size');
                  if (size) {
                    document.documentElement.setAttribute('data-font-size', size);
                    var scales = { sm: '90%', base: '100%', lg: '115%', xl: '130%' };
                    if (scales[size]) {
                      document.documentElement.style.fontSize = scales[size];
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LanguageProvider>
            <FontSizeProvider>{children}</FontSizeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
