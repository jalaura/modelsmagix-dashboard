"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssignPackageSchema, type AssignPackageInput, PACKAGE_TYPES } from "@/lib/validations"
import { toast } from "@/hooks/use-toast"

interface AssignPackageModalProps {
  projectId: string
  children: React.ReactNode
}

export function AssignPackageModal({ projectId, children }: AssignPackageModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AssignPackageInput>({
    resolver: zodResolver(AssignPackageSchema),
    defaultValues: {
      sendEmail: true,
    },
  })

  const onSubmit = async (data: AssignPackageInput) => {
    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/assign-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to assign package")
      }

      toast({
        title: "Package assigned",
        description: "The package has been assigned and payment email sent.",
        variant: "success",
      })

      setOpen(false)
      reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign package",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Package</DialogTitle>
          <DialogDescription>
            Select a package and provide the payment link for the client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Package Type</Label>
            <Select onValueChange={(value) => setValue("packageType", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_TYPES.map((pkg) => (
                  <SelectItem key={pkg.value} value={pkg.value}>
                    {pkg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.packageType && (
              <p className="text-sm text-destructive">{errors.packageType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentLinkUrl">Payment Link (Lemon Squeezy)</Label>
            <Input
              id="paymentLinkUrl"
              placeholder="https://yourstore.lemonsqueezy.com/checkout/..."
              {...register("paymentLinkUrl")}
            />
            {errors.paymentLinkUrl && (
              <p className="text-sm text-destructive">{errors.paymentLinkUrl.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmail"
              className="h-4 w-4 rounded border-gray-300"
              {...register("sendEmail")}
            />
            <Label htmlFor="sendEmail" className="font-normal">
              Send payment email to client
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Assigning..." : "Assign Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
