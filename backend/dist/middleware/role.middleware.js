import { AppError } from "./error.middleware.js";
import { pool } from "../db/pool.js";
;
export const requireWorkspaceRole = (allowedRole) => {
    return async (req, res, next) => {
        const userId = req.user;
        // Extract workspace ID from parameter, query, or body
        const workspaceIdRaw = req.params.workspaceId || req.params.id || req.query.workspace_id || req.body.workspace_id;
        if (!userId)
            return next(new AppError(401, "user is not authenticated"));
        if (!workspaceIdRaw)
            return next(new AppError(400, "workspace ID is required for verification"));
        const workspaceId = Number(workspaceIdRaw);
        if (isNaN(workspaceId))
            return next(new AppError(400, "invalid workspace ID format"));
        try {
            // Query the user's role in this workspace
            const result = await pool.query("SELECT role FROM workspace_members WHERE user_id =$1 AND workspace_id = $2", [userId, workspaceId]);
            if (result.rows.length === 0)
                return next(new AppError(403, "Access Denied: you are not member of this workspace"));
            const userRole = result.rows[0].role;
            if (!allowedRole.includes(userRole))
                return next(new AppError(403, "Access Denied : insuficient permissions for this action"));
            req.workspace = {
                id: workspaceId,
                role: userRole
            };
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
//# sourceMappingURL=role.middleware.js.map