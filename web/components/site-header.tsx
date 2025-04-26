"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/ui/logo"

const routes = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/about",
    label: "About Us",
  },
  {
    href: "/pricing",
    label: "Pricing",
  },
  {
    href: "/testimonials",
    label: "Testimonials",
  },
  {
    href: "/contact",
    label: "Contact",
  },
]
export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="hidden items-center space-x-2 md:flex">
            <Logo />
            <span className="hidden font-bold sm:inline-block">MentorMatch</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:gap-2">
            {/* If there's a session, show Dashboard link, otherwise show Sign In/Sign Up */}
            {session ? (
              <Link href="/dashboard">
          <Button variant="default" size="sm">
            Dashboard
          </Button>
              </Link>
            ) : (
              <>
          <Link href="/signin">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="default" size="sm">
              Sign Up
            </Button>
          </Link>
              </>
            )}
          </div>
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open Menu">
          <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Logo className="h-6 w-6" />
            <span>MentorMatch</span>
          </Link>
          <div className="grid gap-3">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {route.label}
              </Link>
            ))}
          </div>
          <div className="grid gap-2">
            {/* Mobile menu version of the same conditional rendering */}
            {session ? (
              <Link href="/dashboard">
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
            <Button variant="ghost" className="w-full justify-start">
              Sign In
            </Button>
                </Link>
                <Link href="/signup">
            <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

