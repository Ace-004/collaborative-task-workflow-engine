import { pool } from "../db/pool.js";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { createUserQuery, getUserQuery } from "../db/queries/user.query.js";
import { generateToken } from "../utils/generatetoken.js";
import { AppError } from "../middleware/error.middleware.js";

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 60 * 60 * 1000,
};

export const registerUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError(400, "Missing email or password"));
  }
  try {
    const exist_user = await getUserQuery(email);
    if (exist_user) {
      return next(new AppError(400, "Email already registered"));
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user = await createUserQuery(email, password_hash);
    const token = generateToken(user);
    res.cookie("token", token, authCookieOptions);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const loginUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError(400, "Missing email or password"));
  }
  try {
    const user = await getUserQuery(email);
    console.log(user);

    if (!user) {
      return next(new AppError(404, "User not found"));
    }
    const password_correct = await bcrypt.compare(password, user.password_hash);
    if (!password_correct) {
      return next(new AppError(400, "Invalid credentials"));
    }
    const data = {
      id: user.id,
      email,
    };
    const token = generateToken(data);
    res.cookie("token", token, authCookieOptions);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
