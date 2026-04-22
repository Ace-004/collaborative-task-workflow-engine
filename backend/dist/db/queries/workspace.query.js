import { pool } from "../pool.js";
export const createWorkspaceQuery = async (name, owner_id) => {
    const result = await pool.query("INSERT INTO workspace (name,owner_id) values ($1,$2) RETURNING *", [name, owner_id]);
    console.log(result.rows);
    const workspaceId = result.rows[0].id;
    // Add owner as a workspace member
    await pool.query("INSERT INTO workspace_members (workspace_id, user_id) VALUES ($1, $2) RETURNING *", [workspaceId, owner_id]);
    return result.rows[0];
};
export const getWorkspaceQuery = async (userId) => {
    try {
        const result = await pool.query("SELECT w.name,w.id,w.owner_id FROM workspace w JOIN workspace_members wm ON w.id=wm.workspace_id WHERE wm.user_id = $1", [userId]);
        console.log(userId);
        console.log("result ", result);
        console.log("result rows ", result.rows);
        return result.rows;
    }
    catch (error) {
        console.log(error);
    }
};
export const getWorkspaceByIdQuery = async (workspace_id) => {
    const result = await pool.query("SELECT * FROM workspace WHERE id=$1", [
        workspace_id,
    ]);
    return result.rows[0];
};
export const deleteWorkspaceQuery = async (workspace_id) => {
    const result = await pool.query("DELETE FROM workspace WHERE id=$1", [
        workspace_id,
    ]);
};
//# sourceMappingURL=workspace.query.js.map