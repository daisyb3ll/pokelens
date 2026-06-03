import SessionProvider from './components/SessionProvider'
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from './components/NavBar'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "pokélens",
  description: "your pocket pokédex",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
        <NavBar />
        {children}
        </SessionProvider>
      </body>
    </html>
  );
}