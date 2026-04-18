import { NextResponse } from "next/server";

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true as const,
    data,
    ...(message ? { message } : {}),
  });
}

export function errorResponse(
  error: string,
  status: number,
  code?: string,
) {
  return NextResponse.json(
    {
      success: false as const,
      error,
      ...(code ? { code } : {}),
    },
    { status },
  );
}

export const ApiErrors = {
  unauthorized: () => errorResponse("Unauthorized", 401, "UNAUTHORIZED"),
  forbidden: () => errorResponse("Forbidden", 403, "FORBIDDEN"),
  notFound: (resource = "Resource") =>
    errorResponse(`${resource} not found`, 404, "NOT_FOUND"),
  validationError: (msg: string) =>
    errorResponse(msg, 400, "VALIDATION_ERROR"),
  rateLimited: (msg: string) => errorResponse(msg, 429, "RATE_LIMITED"),
  serverError: () =>
    errorResponse("Something went wrong. Please try again later.", 500, "SERVER_ERROR"),
};
