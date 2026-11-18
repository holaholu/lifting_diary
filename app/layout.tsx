import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  title: "Lifting Diary",
  description: "Log your workouts and watch your strength grow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex h-16 items-center justify-between gap-4 border-b border-primary/20 bg-card/70 px-6 backdrop-blur">
            <Link
              href="/"
              className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent"
            >
              Lifting Diary
            </Link>
            <div className="flex items-center gap-3">
              <Suspense>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <Button variant="outline">Sign in</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button>Sign up</Button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </Suspense>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}