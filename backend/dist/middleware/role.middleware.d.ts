import type { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            workspace?: {
                id: number;
                role: "admin" | "member";
            };
        }
    }
}
export declare const requireWorkspaceRole: (allowedRole: ("admin" | "member")[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=role.middleware.d.ts.map