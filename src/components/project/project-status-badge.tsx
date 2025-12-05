import { Badge } from "@/components/ui/badge"
import { STATUS_INFO } from "@/lib/state-machine/project-state-machine"
import type { ProjectStatus } from "@prisma/client"

interface ProjectStatusBadgeProps {
  status: ProjectStatus
}

const STATUS_VARIANTS: Record<string, "blue" | "yellow" | "green" | "purple" | "indigo" | "orange" | "default"> = {
  blue: "blue",
  yellow: "yellow",
  green: "green",
  purple: "purple",
  indigo: "indigo",
  orange: "orange",
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const info = STATUS_INFO[status]
  const variant = STATUS_VARIANTS[info.color] || "default"

  return (
    <Badge variant={variant}>
      {info.label}
    </Badge>
  )
}
