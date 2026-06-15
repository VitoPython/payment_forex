import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Cloud Forex Servers — Buy Forex VPS plans",
  description:
    "Forex VPS plans across multiple datacenters with flexible billing periods.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
