import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeHart HVAC - Quote Estimator",
  description: "Get your instant HVAC cost estimate from DeHart HVAC",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
