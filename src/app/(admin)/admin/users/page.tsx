export const runtime = 'edge'

import Link from "next/link"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Users - Admin - ModelMagic",
  description: "View and manage users",
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    role?: "CLIENT" | "ADMIN"
  }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const limit = 20

  const where = params.role ? { role: params.role } : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          {total} user{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Role Filter */}
      <div className="flex gap-2">
        <Link
          href="/admin/users"
          className={`rounded-full px-4 py-1.5 text-sm ${
            !params.role ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/users?role=CLIENT"
          className={`rounded-full px-4 py-1.5 text-sm ${
            params.role === "CLIENT"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Clients
        </Link>
        <Link
          href="/admin/users?role=ADMIN"
          className={`rounded-full px-4 py-1.5 text-sm ${
            params.role === "ADMIN"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Admins
        </Link>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Projects
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{user._count.projects}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/users?page=${p}${params.role ? `&role=${params.role}` : ""}`}
              className={`rounded px-3 py-1 text-sm ${
                page === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
