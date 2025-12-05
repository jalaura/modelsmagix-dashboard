"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { STATUS_INFO, getValidNextStatuses } from "@/lib/state-machine/project-state-machine"
import type { ProjectStatus } from "@prisma/client"

interface StatusUpdateModalProps {
  projectId: string
  currentStatus: ProjectStatus
  children: React.ReactNode
}

export function StatusUpdateModal({
  projectId,
  currentStatus,
  children,
}: StatusUpdateModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newStatus, setNewStatus] = useState<ProjectStatus | null>(null)
  const [notes, setNotes] = useState("")
  const router = useRouter()

  const validStatuses = getValidNextStatuses(currentStatus)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update status")
      }

      toast({
        title: "Status updated",
        description: `Project status changed to ${STATUS_INFO[newStatus].label}`,
        variant: "success",
      })

      setOpen(false)
      setNewStatus(null)
      setNotes("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (validStatuses.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Change the project status. This will trigger relevant notifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <p className="text-sm text-muted-foreground">
              {STATUS_INFO[currentStatus].label} - {STATUS_INFO[currentStatus].description}
            </p>
          </div>

          <div className="space-y-2">
            <Label>New Status</Label>
            <Select onValueChange={(value) => setNewStatus(value as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {validStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_INFO[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !newStatus}>
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
