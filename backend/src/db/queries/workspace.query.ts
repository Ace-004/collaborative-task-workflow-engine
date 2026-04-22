import { pool } from "../pool.js";

export const createWorkspaceQuery = async (name: string, owner_id: number) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO workspace (name,owner_id) values ($1,$2) RETURNING *",
      [name, owner_id],
    );
    const workspaceId = result.rows[0].id;

    // Add owner as a workspace member
    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id,role) VALUES ($1, $2,'admin') RETURNING *",
      [workspaceId, owner_id],
    );
    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in createWorkspaceQuery:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const getWorkspaceQuery = async (userId: number) => {
  try {
    const result = await pool.query(
      "SELECT w.name,w.id,w.owner_id FROM workspace w JOIN workspace_members wm ON w.id=wm.workspace_id WHERE wm.user_id = $1",
      [userId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error in getWorkspaceQuery:", error);
    throw error;
  }
};

export const getWorkspaceByIdQuery = async (workspace_id: string, user_id: number) => {
  try {
    const result = await pool.query(
      "SELECT w.id,w.name,w.owner_id,wm.role FROM workspace w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE w.id=$1 AND wm.user_id=$2",
      [workspace_id, user_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in getWorkspaceByIdQuery:", error);
    throw error;
  }
};

export const deleteWorkspaceQuery = async (workspace_id: string, owner_id: number) => {
  try {
    const result = await pool.query(
      "DELETE FROM workspace WHERE id=$1 and owner_id=$2 RETURNING *",
      [workspace_id, owner_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in deleteWorkspaceQuery:", error);
    throw error;
  }
};

export const joinWorkspaceQuery = async (user_id: number, workspace_id: number) => {
  try {
    await pool.query(
      "INSERT INTO workspace_members (user_id,workspace_id,role) values ($1,$2,'member')",
      [user_id, workspace_id]
    );
  } catch (error) {
    console.error("Error in joinWorkspaceQuery:", error);
    throw error;
  }
};

