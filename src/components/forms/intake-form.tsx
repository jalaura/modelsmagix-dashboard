"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { CreateProjectSchema, type CreateProjectInput, PRODUCT_TYPES } from "@/lib/validations"

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileKey: string
  mimeType: string
  fileSize: number
}

export function IntakeForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      referenceImages: [],
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const newFiles: UploadedFile[] = []

      for (const file of Array.from(files)) {
        // Get presigned URL
        const uploadRes = await fetch("/api/assets/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            type: "REFERENCE",
          }),
        })

        if (!uploadRes.ok) {
          throw new Error("Failed to get upload URL")
        }

        const { data } = await uploadRes.json()

        // Upload file to presigned URL
        const uploadToR2 = await fetch(data.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        })

        if (!uploadToR2.ok) {
          throw new Error("Failed to upload file")
        }

        newFiles.push({
          fileName: file.name,
          fileUrl: data.publicUrl,
          fileKey: data.key,
          mimeType: file.type,
          fileSize: file.size,
        })
      }

      const allFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(allFiles)
      setValue("referenceImages", allFiles)
    } catch (err) {
      setError("Failed to upload images. Please try again.")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    setValue("referenceImages", newFiles)
  }

  const onSubmit = async (data: CreateProjectInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to submit project")
      }

      setSubmitSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit project")
    } finally {
      setIsLoading(false)
    }
  }

  if (submitSuccess) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold">Project Submitted!</h3>
          <p className="text-muted-foreground">
            We&apos;ve received your project request. Check your email for confirmation
            and next steps.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Contact Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Jane Smith"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="button" onClick={() => setStep(2)} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Project Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Project Details</h3>
          <div className="space-y-2">
            <Label htmlFor="productType">Product Type</Label>
            <select
              id="productType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("productType")}
            >
              <option value="">Select a product type</option>
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.productType && (
              <p className="text-sm text-destructive">{errors.productType.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="creativeBrief">Creative Brief</Label>
            <Textarea
              id="creativeBrief"
              placeholder="Describe how you'd like your products to be styled. Include details about model poses, backgrounds, mood, etc."
              rows={5}
              {...register("creativeBrief")}
            />
            {errors.creativeBrief && (
              <p className="text-sm text-destructive">{errors.creativeBrief.message}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Upload Images */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upload Reference Images</h3>
          <p className="text-sm text-muted-foreground">
            Upload flat-lay photos of your products. We recommend clear, well-lit images.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-primary hover:underline"
              >
                {isUploading ? "Uploading..." : "Click to upload images"}
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                JPEG, PNG, or WebP. Max 10MB each.
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="aspect-square rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.referenceImages && (
              <p className="text-sm text-destructive">
                {errors.referenceImages.message}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading || uploadedFiles.length === 0}
              className="flex-1"
            >
              {isLoading ? "Submitting..." : "Submit Project"}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
