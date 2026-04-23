import { pool } from "../pool.js";
export const createTaskQuery = async (title, description, priority, project_id, assigned_user_id, user_id, client) => {
    try {
        if (priority === "") {
            priority = null;
        }
        const result = await client.query("INSERT INTO tasks (title,description,priority,project_id,assigned_user_id) SELECT $1, $2, $3, $4, $5 WHERE EXISTS (SELECT 1 FROM projects p JOIN workspace w ON p.workspace_id = w.id WHERE p.id = $4 AND w.owner_id = $6) RETURNING *", [title, description, priority, project_id, assigned_user_id, user_id]);
        return result.rows[0];
    }
    catch (error) {
        console.error("error occurred", error);
        throw error;
    }
};
export const getAllTasksQuery = async (project_id) => {
    try {
        const result = await pool.query("SELECT * FROM tasks WHERE project_id = $1 ", [project_id]);
        return result.rows;
    }
    catch (error) {
        console.error("error occurred", error);
        throw error;
    }
};
export const getTaskByIdQuery = async (id) => {
    try {
        const result = await pool.query("SELECT t.title,t.description,t.status,t.priority,t.project_id,t.assigned_user_id FROM tasks t JOIN projects p on t.project_id=p.id WHERE t.id=$1", [id]);
        return result.rows[0];
    }
    catch (error) {
        console.error("error occurred", error);
        throw error;
    }
};
export const deleteTaskQuery = async (id, user_id, client) => {
    try {
        const result = await client.query("DELETE FROM tasks WHERE id=$1 AND project_id IN (SELECT p.id FROM projects p JOIN workspace w ON p.workspace_id = w.id WHERE w.owner_id = $2) RETURNING *", [id, user_id]);
        return result.rows[0];
    }
    catch (error) {
        console.error("error occurred", error);
        throw error;
    }
};
//# sourceMappingURL=task.query.js.map