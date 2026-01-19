import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>CoopReady</Link>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-8 max-w-4xl p-5 text-center">
          <h1 className="text-4xl font-bold">
            Optimize Your Resume for Tech
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered resume optimization for students and career changers.
            Get ATS scores, smart rewrites, and land your dream co-op or internship.
          </p>
          <div className="flex gap-4 justify-center mt-4">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p className="text-muted-foreground">
            CoopReady - AI-Powered Resume Optimization
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
