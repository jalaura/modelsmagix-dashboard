"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#dc2626",
                marginBottom: "1rem",
              }}
            >
              Critical Error
            </h1>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              A critical error occurred and the application could not recover. Please refresh the page or try again later.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                marginRight: "0.5rem",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                backgroundColor: "transparent",
                color: "#374151",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "1px solid #d1d5db",
                cursor: "pointer",
              }}
            >
              Go home
            </button>
            {process.env.NODE_ENV === "development" && error.message && (
              <pre
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "0.5rem",
                  textAlign: "left",
                  overflow: "auto",
                  fontSize: "0.75rem",
                }}
              >
                {error.message}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
