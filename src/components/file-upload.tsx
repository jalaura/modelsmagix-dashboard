"use client"

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  className?: string
  disabled?: boolean
}

interface UploadingFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
}

export function FileUpload({
  onUpload,
  accept = "image/*",
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 10,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = []
      const errors: string[] = []

      for (const file of files) {
        if (file.size > maxSizeBytes) {
          errors.push(`${file.name} exceeds ${maxSizeMB}MB limit`)
          continue
        }

        if (accept !== "*" && !file.type.match(accept.replace("*", ".*"))) {
          errors.push(`${file.name} is not an accepted file type`)
          continue
        }

        valid.push(file)
      }

      if (valid.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        return { valid: valid.slice(0, maxFiles), errors }
      }

      return { valid, errors }
    },
    [accept, maxFiles, maxSizeBytes, maxSizeMB]
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const { valid, errors } = validateFiles(fileArray)

      if (errors.length > 0) {
        console.warn("File validation errors:", errors)
      }

      if (valid.length === 0) return

      setIsUploading(true)
      setUploadingFiles(
        valid.map((file) => ({
          file,
          progress: 0,
          status: "pending" as const,
        }))
      )

      // Simulate upload progress (in real implementation, this would be from XHR/fetch)
      const uploadPromises = valid.map(async (file, index) => {
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "uploading" as const } : f
          )
        )

        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setUploadingFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          )
        }
      })

      await Promise.all(uploadPromises)

      try {
        await onUpload(valid)
        setUploadingFiles((prev) =>
          prev.map((f) => ({ ...f, status: "complete" as const }))
        )
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: "error" as const,
            error: error instanceof Error ? error.message : "Upload failed",
          }))
        )
      } finally {
        setIsUploading(false)
        // Clear after a delay
        setTimeout(() => {
          setUploadingFiles([])
        }, 2000)
      }
    },
    [onUpload, validateFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled || isUploading) return

      const { files } = e.dataTransfer
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [disabled, isUploading, handleFiles]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !isUploading) {
        setIsDragOver(true)
      }
    },
    [disabled, isUploading]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        handleFiles(files)
      }
      // Reset input
      e.target.value = ""
    },
    [handleFiles]
  )

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }, [disabled, isUploading])

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragOver && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !isDragOver && !disabled && "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-4 text-sm font-medium">
            {isDragOver ? "Drop files here" : "Click to upload or drag and drop"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {accept === "image/*" ? "PNG, JPG, GIF" : accept} up to {maxSizeMB}MB
            {multiple && ` (max ${maxFiles} files)`}
          </p>
        </div>
      </div>

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{item.file.name}</span>
                <span className="text-muted-foreground">
                  {item.status === "complete"
                    ? "Complete"
                    : item.status === "error"
                      ? "Failed"
                      : `${item.progress}%`}
                </span>
              </div>
              <Progress
                value={item.progress}
                className={cn(
                  "h-2",
                  item.status === "complete" && "[&>div]:bg-green-500",
                  item.status === "error" && "[&>div]:bg-destructive"
                )}
              />
              {item.error && (
                <p className="text-xs text-destructive">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Simple upload button variant
interface UploadButtonProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  multiple?: boolean
  disabled?: boolean
  children?: React.ReactNode
}

export function UploadButton({
  onUpload,
  accept = "image/*",
  multiple = false,
  disabled = false,
  children,
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      await onUpload(Array.from(files))
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Uploading..." : children || "Upload"}
      </Button>
    </>
  )
}
