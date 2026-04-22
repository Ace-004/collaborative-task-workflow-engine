import { pool } from '../pool.js';

export const createProjectQuery = async (name: string, workspace_id: number) => {
  try {
    const result = await pool.query(
      "INSERT INTO projects (name,workspace_id) values ($1,$2) RETURNING *",
      [name, workspace_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in createProjectQuery:", error);
    throw error;
  }
};

export const getAllProjectsQuery = async (workspace_id: string) => {
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

export const deleteProjectQuery = async (id: string) => {
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id=$1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in deleteProjectQuery:", error);
    throw error;
  }
};