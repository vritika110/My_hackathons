import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata = {
  title: "HackTracker — My Hackathon Dashboard",
  description:
    "Track all your hackathons, deadlines, prizes, and team members in one beautiful place. Built for vritika110@gmail.com.",
  keywords: "hackathon, tracker, deadlines, prizes, team, devpost",
  openGraph: {
    title: "HackTracker",
    description: "Personal hackathon management dashboard",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#080812",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#080812] text-slate-100 min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
