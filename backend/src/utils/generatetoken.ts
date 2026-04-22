import jwt from "jsonwebtoken";

interface User {
  id: number;
  email?: string;
}
const JWT_SECRET = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET) throw new Error("jwt secret not defined");// type narrowing because jwt-secret could be null

export const generateToken = (user: User) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });
};
