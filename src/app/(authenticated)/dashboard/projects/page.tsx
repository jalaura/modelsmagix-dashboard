export const runtime = 'edge'

import Link from "next/link"
import { auth } from "@/lib/auth"
import { projectService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/project/project-card"

export const metadata = {
  title: "My Projects - ModelMagic",
  description: "View all your projects",
}

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) return null

  const { projects, pagination } = await projectService.listProjects({
    userId: session.user.id,
    limit: 20,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            {pagination.total} project{pagination.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">New Project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="mb-4 text-muted-foreground">No projects yet</p>
          <Button asChild>
            <Link href="/submit">Start Your First Project</Link>
          </Button>
        </div>
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
  )
}
