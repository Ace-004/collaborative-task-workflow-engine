import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const message = err.message || "Internal Server Error";

  //  console.error('=== REAL ERROR ===');
  // console.error('Message:', err.message);
  // console.error('Stack:', err.stack);
  // console.error('Full error:', err);
  // console.error('==================');

  console.error(`[ERROR] ${req.method} ${req.path} - ${message}`);
  if (statusCode === 500) {

    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};