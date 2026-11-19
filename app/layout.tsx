import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
const terminalFont = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap", fallback: ["monospace"] });
export const metadata: Metadata = {
  title: "Soponloe Sovann | Cloud Infrastructure & Operations",
  description: "Explore Soponloe Sovann’s infrastructure deployments, backend troubleshooting, and VM consolidation simulation research through an interactive terminal portfolio.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={terminalFont.variable}><body>{children}</body></html>;
}
