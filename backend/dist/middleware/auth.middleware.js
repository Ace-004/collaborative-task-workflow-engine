import { verifyToken } from "../utils/verifytoken.js";
export const verifyUser = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header)
            throw new Error("no token");
        if (!header || header.split(" ")[0] !== "Bearer")
            res.status(401).json({ success: false, message: "unauthorized" });
        const token = header.split(" ")[1];
        if (!token)
            throw new Error("no token");
        const decoded = verifyToken(token);
        // (req as any).user=decoded.userId
        req.user = decoded.id;
        next();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "server error" });
    }
};
//# sourceMappingURL=auth.middleware.js.map