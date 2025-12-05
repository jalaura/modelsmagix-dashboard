"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@prisma/client"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email: string
    role: UserRole
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const isAdmin = user.role === "ADMIN"

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-xl font-bold text-primary">
            ModelMagic
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className={`text-sm ${
                    pathname === "/admin" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/projects"
                  className={`text-sm ${
                    pathname.startsWith("/admin/projects") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Projects
                </Link>
                <Link
                  href="/admin/users"
                  className={`text-sm ${
                    pathname.startsWith("/admin/users") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Users
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm ${
                    pathname === "/dashboard" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/projects"
                  className={`text-sm ${
                    pathname.startsWith("/dashboard/projects") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Projects
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground md:block">
            {user.name || user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
