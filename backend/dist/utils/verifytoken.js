import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET)
    throw new Error("no secret provided");
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
//# sourceMappingURL=verifytoken.js.map