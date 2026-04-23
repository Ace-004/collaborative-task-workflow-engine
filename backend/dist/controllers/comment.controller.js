import { createCommentQuery, deleteCommentQuery } from "../db/queries/comment.query.js";
export const createComment = async (req, res) => {
    const { task_id, content } = req.body;
    const user = req.user;
    try {
        if (typeof user === "number") {
            const comment = await createCommentQuery(task_id, user, content);
            if (!comment)
                return res.status(403).json({ success: false, message: "Unauthorized or task not found" });
            res.status(201).json({ success: true, data: comment });
        }
    }
    catch (error) {
        console.error('error occurred', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const deleteComment = async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    try {
        if (typeof user === "number") {
            const task = await deleteCommentQuery(Number(id), user);
            if (!task)
                return res.status(403).json({ success: false, message: "Unauthorized or comment not found" });
            res.status(200).json({ success: true, message: "comment deleted successfully" });
        }
    }
    catch (error) {
        console.error('error occurred', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
//# sourceMappingURL=comment.controller.js.map