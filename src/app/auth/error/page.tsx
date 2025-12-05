export const runtime = 'edge'

import { Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Authentication Error - ModelMagic",
  description: "An error occurred during authentication",
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access denied. You do not have permission to sign in.",
  Verification: "The verification link may have expired or already been used.",
  Default: "An unexpected error occurred during authentication.",
}

function ErrorContent({ searchParams }: { searchParams: { error?: string } }) {
  const errorType = searchParams.error || "Default"
  const errorMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Try Again</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            If this problem persists, please{" "}
            <Link href="mailto:support@modelmagic.com" className="text-primary hover:underline">
              contact support
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ErrorContent searchParams={params} />
    </Suspense>
  )
}
