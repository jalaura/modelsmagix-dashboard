export const runtime = 'edge'

import Link from "next/link"
import { auth } from "@/lib/auth"
import { projectService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectCard } from "@/components/project/project-card"

export const metadata = {
  title: "Dashboard - ModelMagic",
  description: "View and manage your projects",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const { projects } = await projectService.listProjects({
    userId: session.user.id,
    limit: 5,
  })

  const stats = await projectService.getProjectStats(session.user.id)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your projects
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">New Project</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready for Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">No projects yet</p>
              <Button asChild>
                <Link href="/submit">Start Your First Project</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/dashboard/projects/${project.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
