import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(message, 400, code)
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(message, 401, "UNAUTHORIZED")
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(message, 403, "FORBIDDEN")
  }

  static notFound(message = "Not found") {
    return new ApiError(message, 404, "NOT_FOUND")
  }

  static conflict(message: string, code?: string) {
    return new ApiError(message, 409, code)
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(message, 429, "RATE_LIMITED")
  }

  static internal(message = "Internal server error") {
    return new ApiError(message, 500, "INTERNAL_ERROR")
  }
}

interface ErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error("API Error:", error)

  // Handle ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }))

    return NextResponse.json(
      {
        error: "Validation error",
        code: "VALIDATION_ERROR",
        details: formattedErrors,
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        return NextResponse.json(
          {
            error: "A record with this value already exists",
            code: "UNIQUE_CONSTRAINT",
          },
          { status: 409 }
        )
      case "P2025":
        // Record not found
        return NextResponse.json(
          {
            error: "Record not found",
            code: "NOT_FOUND",
          },
          { status: 404 }
        )
      case "P2003":
        // Foreign key constraint violation
        return NextResponse.json(
          {
            error: "Related record not found",
            code: "FOREIGN_KEY_CONSTRAINT",
          },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          {
            error: "Database error",
            code: error.code,
          },
          { status: 500 }
        )
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: "Invalid data provided",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    )
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred"

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    )
  }

  // Fallback for unknown error types
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  )
}

// Wrapper for API route handlers with error handling
export function withErrorHandler<T>(
  handler: (req: Request, context?: T) => Promise<NextResponse>
) {
  return async (req: Request, context?: T): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Client-side error handling utilities
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export async function parseApiError(response: Response): Promise<ApiErrorResponse> {
  try {
    const data = await response.json()
    return {
      error: data.error || "An error occurred",
      code: data.code,
      details: data.details,
    }
  } catch {
    return {
      error: `Request failed with status ${response.status}`,
      code: "PARSE_ERROR",
    }
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as ApiErrorResponse).error === "string"
  ) {
    return (error as ApiErrorResponse).error
  }
  return "An unexpected error occurred"
}
