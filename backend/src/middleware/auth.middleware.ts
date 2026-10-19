import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/verifytoken.js";
import { AppError } from "./error.middleware.js";

export const verifyUser = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) return next(new AppError(401, "Authentication required"));
  try {
    const decoded = verifyToken(token) as { id: number };
    req.user = decoded.id;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired session"));
  }
};
