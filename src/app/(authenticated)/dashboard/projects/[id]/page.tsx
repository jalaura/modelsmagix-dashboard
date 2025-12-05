export const runtime = 'edge'

import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { projectService, assetService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProjectStatusBadge } from "@/components/project/project-status-badge"
import { STATUS_INFO } from "@/lib/state-machine/project-state-machine"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const project = await projectService.getProjectById(id, { includeAssets: false })

  return {
    title: project ? `${project.productType} - ModelMagic` : "Project Not Found",
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const { id } = await params
  const project = await projectService.getProjectById(id, {
    includeAssets: true,
    includeHistory: true,
  })

  if (!project) {
    notFound()
  }

  // Check ownership
  if (project.userId !== session.user.id) {
    notFound()
  }

  const assets = await assetService.getProjectAssets(id)
  const statusInfo = STATUS_INFO[project.status]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/projects"
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
      </div>

      {/* Status Message */}
      <Card>
        <CardContent className="py-4">
          <p className="text-muted-foreground">{statusInfo.description}</p>
        </CardContent>
      </Card>

      {/* Project Details */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Creative Brief */}
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

        {/* Package Info */}
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
              <p className="text-muted-foreground">
                Package not yet assigned
              </p>
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
            <p className="text-muted-foreground">No reference images uploaded</p>
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
      {assets.generated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Model Shots ({assets.generated.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {asset.status}
                    </span>
                    {project.status === "REVIEW_READY" && asset.status === "READY" && (
                      <Button size="sm" variant="outline">
                        Request Revision
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {project.status === "REVIEW_READY" && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-muted-foreground">
              Ready to approve? Once approved, your project will be marked as complete.
            </p>
            <Button>Approve All</Button>
          </CardContent>
        </Card>
      )}

      {project.status === "AWAITING_PAYMENT" && project.paymentLinkUrl && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-muted-foreground">
              Complete payment to start production.
            </p>
            <Button asChild>
              <a href={project.paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                Complete Payment
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
