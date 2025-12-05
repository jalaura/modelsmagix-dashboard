export const runtime = 'edge'

import { Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Check Your Email - ModelMagic",
  description: "Check your email for the magic link",
}

function VerifyContent({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email || "your email"

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to sign in to your account. The link will expire in 24 hours.
          </p>
          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-medium">Didn&apos;t receive the email?</p>
            <ul className="mt-2 list-inside list-disc text-muted-foreground">
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email</li>
              <li>
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Try again
                </Link>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyContent searchParams={params} />
    </Suspense>
  )
}
