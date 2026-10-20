import { pool } from "../db/pool.js";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { createUserQuery, getUserQuery } from "../db/queries/user.query.js";
import { generateToken } from "../utils/generatetoken.js";
import { AppError } from "../middleware/error.middleware.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// bcrypt hash of a random string; only used to equalise timing for unknown emails
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 24 * 60 * 60 * 1000, // matches the JWT's 1d expiry
};

export const registerUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return next(new AppError(400, "Missing email or password"));
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return next(new AppError(400, "Invalid email address"));
  }
  if (password.length < 8 || password.length > 72) {
    return next(new AppError(400, "Password must be 8-72 characters"));
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
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return next(new AppError(400, "Missing email or password"));
  }
  try {
    const user = await getUserQuery(email);
    // Same response for unknown email and wrong password (no account enumeration).
    // Compare against a dummy hash when the user is missing so timing is similar.
    const password_correct = await bcrypt.compare(
      password,
      user?.password_hash ?? DUMMY_HASH,
    );
    if (!user || !password_correct) {
      return next(new AppError(401, "Invalid credentials"));
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

export const logoutUserController = (_req: Request, res: Response) => {
  // httpOnly cookies can only be cleared by the server; options must match those used to set it.
  const { maxAge: _maxAge, ...clearOptions } = authCookieOptions;
  res.clearCookie("token", clearOptions);
  res.status(200).json({ success: true, message: "Logged out" });
};
