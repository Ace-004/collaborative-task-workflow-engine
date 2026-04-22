import { pool } from "../pool.js";

export const createWorkspaceQuery = async (name: string, owner_id: number) => {
  await pool.query("BEGIN");
  const result = await pool.query(
    "INSERT INTO workspace (name,owner_id) values ($1,$2) RETURNING *",
    [name, owner_id],
  );
  console.log(result.rows);
  const workspaceId = result.rows[0].id;

  // Add owner as a workspace member
  await pool.query(
    "INSERT INTO workspace_members (workspace_id, user_id,role) VALUES ($1, $2,'admin') RETURNING *",
    [workspaceId, owner_id],
  );
  await pool.query("COMMIT");

  return result.rows[0];
};

export const getWorkspaceQuery = async (userId: number) => {
  try {
    const result = await pool.query(
      "SELECT w.name,w.id,w.owner_id FROM workspace w JOIN workspace_members wm ON w.id=wm.workspace_id WHERE wm.user_id = $1",
      [userId],
    );
    console.log(userId);
    console.log("result ", result);
    console.log("result rows ", result.rows);
    return result.rows;
  } catch (error) {
    console.log(error);
    throw new Error(`error occured ${error}`);
  }
};

export const getWorkspaceByIdQuery = async (workspace_id: string,user_id:number) => {
  const result = await pool.query("SELECT w.id,w.name,w.owner_id,wm.role FROM workspace w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE w.id=$1 AND wm.user_id=$2", [
    workspace_id,
    user_id
  ]);
  return result.rows[0];
};

export const deleteWorkspaceQuery = async (workspace_id: string) => {
  const result = await pool.query("DELETE FROM workspace WHERE id=$1", [
    workspace_id,
  ]);
};

export const joinWorkspaceQuery=async(user_id:string,workspace_id:number)=>{
  const result = await pool.query("INSERT INTO workspace_members (user_id,workspace_id,role) values ($1,$2,'member')",[user_id,workspace_id]);
}
