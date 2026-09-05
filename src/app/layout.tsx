import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import RosePetalCursor from "@/components/RosePetal";
import Toast from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Radha Rani | Divine Style. Eternal Bond.",
  description:
    "Contemporary fashion inspired by timeless Indian heritage. Explore premium clothing and accessories at Radha Rani.",
  openGraph: {
    title: "Radha Rani | Divine Style. Eternal Bond.",
    description: "Contemporary fashion inspired by timeless Indian heritage.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden antialiased">
        <Providers>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
        <RosePetalCursor />
        <Toast />
      </body>
    </html>
  );
}