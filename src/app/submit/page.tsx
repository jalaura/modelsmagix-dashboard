import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IntakeForm } from "@/components/forms/intake-form"

export const metadata = {
  title: "Start Your Project - ModelMagic",
  description: "Submit your product photos for AI-powered model shots",
}

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            ModelMagic
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Start Your Project</CardTitle>
            <CardDescription>
              Tell us about your products and upload your reference images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntakeForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
