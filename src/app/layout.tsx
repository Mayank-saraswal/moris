import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "allotment/dist/style.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moris - AI-Powered Code Assistant",
  description: "Build, debug, and deploy code with AI assistance in your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plexMono.variable} antialiased`}
      >
        
          <Providers>
            
              {children}
            <Toaster/>
            
          </Providers>
        
      </body>
    </html>
    
  );
}
