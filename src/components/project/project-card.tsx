import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectStatusBadge } from "./project-status-badge"
import type { ProjectStatus } from "@prisma/client"

interface ProjectCardProps {
  project: {
    id: string
    productType: string
    status: ProjectStatus
    createdAt: Date | string
    _count?: {
      assets: number
    }
  }
  href: string
}

export function ProjectCard({ project, href }: ProjectCardProps) {
  const createdAt = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            {project.productType}
          </CardTitle>
          <ProjectStatusBadge status={project.status} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Created {createdAt}</span>
            {project._count && (
              <span>{project._count.assets} images</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
