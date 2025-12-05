import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            ModelMagic
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Button asChild>
              <Link href="/submit">Start Project</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 px-4 py-24 text-center md:py-32">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered Product Photography for{" "}
            <span className="text-primary">E-commerce</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Transform your flat-lay product photos into stunning model shots.
            No photoshoots needed. Just upload your images and let AI do the magic.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/submit">Start Your Project</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/signin">View Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-2 text-lg font-semibold">Submit Your Photos</h3>
                <p className="text-muted-foreground">
                  Upload your flat-lay product images and describe your vision
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-2 text-lg font-semibold">AI Generation</h3>
                <p className="text-muted-foreground">
                  Our AI transforms your products onto realistic model shots
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-2 text-lg font-semibold">Review & Download</h3>
                <p className="text-muted-foreground">
                  Review your images, request revisions, and download when ready
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Submit your first project today and see the magic happen.
            </p>
            <Button asChild size="lg">
              <Link href="/submit">Start Your Project</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} ModelMagic. All rights reserved.</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="mailto:support@modelmagic.com" className="hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
