import { createCommentQuery, deleteCommentQuery } from "../db/queries/comment.query.js";
import { AppError } from "../middleware/error.middleware.js";
export const createComment = async (req, res, next) => {
    const { task_id, content } = req.body;
    const user = req.user;
    if (!task_id || !content) {
        return next(new AppError(400, "Task ID and content are required"));
    }
    try {
        if (typeof user === "number") {
            const comment = await createCommentQuery(Number(task_id), user, content);
            if (!comment)
                return next(new AppError(403, "Unauthorized or task not found"));
            res.status(201).json({ success: true, data: comment });
        }
        else {
            return next(new AppError(401, "User ID not found in session"));
        }
    }
    catch (error) {
        next(error);
    }
};
export const deleteComment = async (req, res, next) => {
    const id = Number(req.params.id);
    const user = req.user;
    if (isNaN(id)) {
        return next(new AppError(400, "Invalid comment ID format"));
    }
    try {
        if (typeof user === "number") {
            const comment = await deleteCommentQuery(id, user);
            if (!comment)
                return next(new AppError(403, "Unauthorized or comment not found"));
            res.status(200).json({ success: true, message: "comment deleted successfully" });
        }
        else {
            return next(new AppError(401, "User ID not found in session"));
        }
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=comment.controller.js.map