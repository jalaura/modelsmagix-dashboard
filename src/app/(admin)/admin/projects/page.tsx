import Link from "next/link"
import { projectService } from "@/lib/services"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectStatusBadge } from "@/components/project/project-status-badge"
import type { ProjectStatus } from "@prisma/client"

export const metadata = {
  title: "All Projects - Admin - ModelMagic",
  description: "View and manage all projects",
}

interface PageProps {
  searchParams: Promise<{
    status?: ProjectStatus
    page?: string
  }>
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const { projects, pagination } = await projectService.listProjects({
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
    includeUser: true,
  })

  const statuses: ProjectStatus[] = [
    "INTAKE_NEW",
    "AWAITING_PAYMENT",
    "PAID",
    "IN_QUEUE",
    "GENERATING",
    "REVIEW_READY",
    "COMPLETED",
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">All Projects</h1>
        <p className="text-muted-foreground">
          {pagination.total} project{pagination.total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/projects"
          className={`rounded-full px-4 py-1.5 text-sm ${
            !params.status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          All
        </Link>
        {statuses.map((status) => (
          <Link
            key={status}
            href={`/admin/projects?status=${status}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              params.status === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {status.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {(project as any).user?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(project as any).user?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{project.productType}</td>
                    <td className="px-4 py-3">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No projects found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <Link
                key={page}
                href={`/admin/projects?page=${page}${params.status ? `&status=${params.status}` : ""}`}
                className={`rounded px-3 py-1 text-sm ${
                  pagination.page === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {page}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
}
