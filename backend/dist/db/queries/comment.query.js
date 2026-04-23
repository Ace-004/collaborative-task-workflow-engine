import { pool } from "../pool.js";
export const createCommentQuery = async (task_id, user_id, content) => {
    try {
        const result = await pool.query("INSERT INTO comments (task_id,user_id,content) SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id JOIN workspace w ON p.workspace_id = w.id WHERE t.id = $1 AND w.owner_id = $2) RETURNING *", [task_id, user_id, content]);
        return result.rows[0];
    }
    catch (error) {
        console.error("error occurred", error);
        throw error;
    }
};
export const deleteCommentQuery = async (id, user_id) => {
    try {
        const result = await pool.query("DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *", [id, user_id]);
        return result.rows[0];
    }
    catch (error) {
        console.error("error occurred", error);
        throw error;
    }
};
//# sourceMappingURL=comment.query.js.map