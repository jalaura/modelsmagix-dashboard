export const runtime = 'edge'

import { notFound } from "next/navigation"
import Link from "next/link"
import { projectService, assetService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProjectStatusBadge } from "@/components/project/project-status-badge"
import { AssignPackageModal } from "@/components/admin/assign-package-modal"
import { MarkPaidModal } from "@/components/admin/mark-paid-modal"
import { StatusUpdateModal } from "@/components/admin/status-update-modal"
import {
  STATUS_INFO,
  getValidNextStatuses,
} from "@/lib/state-machine/project-state-machine"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const project = await projectService.getProjectById(id, { includeAssets: false })

  return {
    title: project
      ? `${project.productType} - Admin - ModelMagic`
      : "Project Not Found",
  }
}

export default async function AdminProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const project = await projectService.getProjectById(id, {
    includeAssets: true,
    includeUser: true,
    includeHistory: true,
  })

  if (!project) {
    notFound()
  }

  const assets = await assetService.getProjectAssets(id)
  const statusInfo = STATUS_INFO[project.status]
  const nextStatuses = getValidNextStatuses(project.status)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/projects"
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Projects
          </Link>
          <h1 className="text-3xl font-bold">{project.productType}</h1>
          <div className="mt-2 flex items-center gap-4">
            <ProjectStatusBadge status={project.status} />
            <span className="text-sm text-muted-foreground">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          {nextStatuses.length > 0 && (
            <StatusUpdateModal projectId={project.id} currentStatus={project.status}>
              <Button variant="outline">Change Status</Button>
            </StatusUpdateModal>
          )}
        </div>
      </div>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{(project as any).user?.name || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{(project as any).user?.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Status Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{statusInfo.description}</p>

          {/* Action buttons based on status */}
          <div className="flex flex-wrap gap-4">
            {project.status === "INTAKE_NEW" && (
              <AssignPackageModal projectId={project.id}>
                <Button>Assign Package</Button>
              </AssignPackageModal>
            )}
            {project.status === "AWAITING_PAYMENT" && (
              <MarkPaidModal projectId={project.id}>
                <Button>Mark as Paid</Button>
              </MarkPaidModal>
            )}
            {project.status === "IN_QUEUE" && (
              <StatusUpdateModal projectId={project.id} currentStatus={project.status}>
                <Button>Start Generating</Button>
              </StatusUpdateModal>
            )}
            {project.status === "GENERATING" && (
              <StatusUpdateModal projectId={project.id} currentStatus={project.status}>
                <Button>Mark Ready for Review</Button>
              </StatusUpdateModal>
            )}
            {project.status === "REVIEW_READY" && (
              <StatusUpdateModal projectId={project.id} currentStatus={project.status}>
                <Button>Mark Complete</Button>
              </StatusUpdateModal>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Creative Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {project.creativeBrief}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.packageType ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">{project.packageType}</span>
                </div>
                {project.paymentLinkUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Link</span>
                    <a
                      href={project.paymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View
                    </a>
                  </div>
                )}
                {project.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid on</span>
                    <span className="font-medium">
                      {new Date(project.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Package not yet assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reference Images */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Images ({assets.reference.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.reference.length === 0 ? (
            <p className="text-muted-foreground">No reference images</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {assets.reference.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-lg border"
                >
                  <img
                    src={asset.fileUrl}
                    alt={asset.fileName}
                    className="aspect-square object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Generated Images ({assets.generated.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.generated.length === 0 ? (
            <p className="text-muted-foreground">No generated images yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {assets.generated.map((asset) => (
                <div key={asset.id} className="space-y-2">
                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border"
                  >
                    <img
                      src={asset.fileUrl}
                      alt={asset.fileName}
                      className="aspect-[3/4] object-cover"
                    />
                  </a>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{asset.status}</span>
                    {asset.revisionNotes && (
                      <span className="text-destructive">Has revisions</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      {project.statusHistory && project.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(project.statusHistory as any[]).map((history, index) => (
                <div key={history.id} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {(project.statusHistory as any[]).length - index}
                  </div>
                  <div>
                    <div className="font-medium">
                      {history.fromStatus
                        ? `${history.fromStatus} → ${history.toStatus}`
                        : history.toStatus}
                    </div>
                    {history.notes && (
                      <p className="text-sm text-muted-foreground">
                        {history.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(history.createdAt).toLocaleString()}
                      {history.changedBy && ` by ${history.changedBy.name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
