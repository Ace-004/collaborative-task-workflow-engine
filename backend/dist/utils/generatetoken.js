import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET)
    throw new Error("jwt secret not defined"); // type narrowing because jwt-secret could be null
export const generateToken = (user) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });
};
//# sourceMappingURL=generatetoken.js.map