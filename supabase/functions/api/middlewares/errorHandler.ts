import type { Context } from "hono";
import { ApiError } from "../utils/apiError.ts";
import { env } from "../config/env.ts";

export function handleHonoError(err: Error, c: Context) {
  let error = err as any;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Internal server error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length && { errors: error.errors }),
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return c.json(response, error.statusCode as any);
}

export function handleNotFound(c: Context) {
  return c.json(
    {
      success: false,
      statusCode: 404,
      message: `Endpoint not found: [${c.req.method}] ${c.req.path}`,
    },
    404
  );
}
