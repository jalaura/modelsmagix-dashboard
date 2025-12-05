"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SendMagicLinkSchema, type SendMagicLinkInput } from "@/lib/validations"

interface LoginFormProps {
  callbackUrl?: string
}

export function LoginForm({ callbackUrl = "/dashboard" }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SendMagicLinkInput>({
    resolver: zodResolver(SendMagicLinkSchema),
  })

  const onSubmit = async (data: SendMagicLinkInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("resend", {
        email: data.email,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setError("Failed to send login link. Please try again.")
      } else {
        // Redirect to verify page
        window.location.href = `/auth/verify?email=${encodeURIComponent(data.email)}`
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Magic Link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        We&apos;ll send you a magic link to sign in instantly.
      </p>
    </form>
  )
}
