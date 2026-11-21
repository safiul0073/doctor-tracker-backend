export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundError = (resource: string) =>
  new AppError(`${resource} not found`, 404, "NOT_FOUND");

export const unauthorizedError = (message = "Authentication required") =>
  new AppError(message, 401, "UNAUTHORIZED");

export const conflictError = (message: string) =>
  new AppError(message, 409, "CONFLICT");

export const badRequestError = (message: string, details?: unknown) =>
  new AppError(message, 400, "BAD_REQUEST", details);
