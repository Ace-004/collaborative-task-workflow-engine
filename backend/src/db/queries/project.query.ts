import { pool } from '../pool.js';

export const createProjectQuery = async (name: string, workspace_id: number, owner_id: number) => {
  try {
    const result = await pool.query(
      "INSERT INTO projects (name, workspace_id) SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM workspace WHERE id = $2 AND owner_id = $3) RETURNING *",
      [name, workspace_id, owner_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in createProjectQuery:", error);
    throw error;
  }
};

export const getAllProjectsQuery = async (workspace_id: number) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE workspace_id = $1",
      [workspace_id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error in getAllProjectsQuery:", error);
    throw error;
  }
};

export const getProjectByIdQuery = async (id: string) => {
  try {
    const result = await pool.query(
      "SELECT p.name,p.id,p.workspace_id,w.name FROM projects p JOIN workspace w on p.workspace_id = w.id WHERE p.id = $1",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in getProjectByIdQuery:", error);
    throw error;
  }
};

export const deleteProjectQuery = async (id: string, owner_id: number) => {
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id=$1 AND workspace_id IN (SELECT id FROM workspace WHERE owner_id=$2) RETURNING *",
      [id, owner_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in deleteProjectQuery:", error);
    throw error;
  }
};
