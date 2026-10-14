import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pos.expensio.com"),
  title: {
    default: "Expensio Hub | All-in-One POS & QR Self-Ordering Platform",
    template: "%s | Expensio Hub",
  },
  description:
    "Streamline your retail and restaurant operations with Expensio Hub. Free cloud POS, digital QR menus, realtime kitchen queue, and smart inventory management.",
  openGraph: {
    type: "website",
    siteName: "Expensio Hub",
    url: "https://pos.expensio.com",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
