import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/ui/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DisasterSense - Image Analysis for Disaster Assessment",
  description: "Image comparison platform for disaster assessment and damage analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="container mx-auto py-6 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
