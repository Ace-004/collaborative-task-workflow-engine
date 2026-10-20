import type { PoolClient } from "pg";
import { pool } from "../pool.js";

export const createTaskQuery = async (
  title: string,
  description: string,
  priority: string | null | undefined,
  project_id: number,
  assigned_user_id: number | null,
  user_id: number,
  client: PoolClient,
) => {
  try {
    if (priority === "") {
      priority = null;
    }
    const result = await client.query(
      `WITH ins AS (
         INSERT INTO tasks (title,description,priority,project_id,assigned_user_id)
         SELECT $1, $2, $3, $4, $5
         WHERE EXISTS (
           SELECT 1 FROM projects p JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
           WHERE p.id = $4 AND wm.user_id = $6
         )
         AND ($5::int IS NULL OR EXISTS (
           SELECT 1 FROM projects p2 JOIN workspace_members wm2 ON p2.workspace_id = wm2.workspace_id
           WHERE p2.id = $4 AND wm2.user_id = $5::int
         ))
         RETURNING *
       )
       SELECT ins.*, p.workspace_id FROM ins JOIN projects p ON p.id = ins.project_id`,
      [title, description, priority, project_id, assigned_user_id, user_id],
    );
    return result.rows[0];
  } catch (error) {
    console.error("error occurred", error);
    throw error;
  }
};

export const isProjectMemberQuery = async (
  project_id: number,
  user_id: number,
): Promise<boolean> => {
  const result = await pool.query(
    "SELECT 1 FROM projects p JOIN workspace_members wm ON wm.workspace_id = p.workspace_id WHERE p.id = $1 AND wm.user_id = $2",
    [project_id, user_id],
  );
  return result.rows.length > 0;
};

export const getAllTasksQuery = async (project_id: number) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE project_id = $1 ",
      [project_id],
    );
    return result.rows;
  } catch (error) {
    console.error("error occurred", error);
    throw error;
  }
};

export const getTaskByIdQuery = async (id: number, user_id: number) => {
  try {
    const result = await pool.query(
      "SELECT t.id,t.title,t.description,t.status,t.priority,t.project_id,t.assigned_user_id FROM tasks t JOIN projects p ON t.project_id=p.id JOIN workspace_members wm ON wm.workspace_id=p.workspace_id WHERE t.id=$1 AND wm.user_id=$2",
      [id, user_id],
    );
    return result.rows[0];
  } catch (error) {
    console.error("error occurred", error);
    throw error;
  }
};

export const deleteTaskQuery = async (
  id: number,
  user_id: number,
  client: PoolClient,
) => {
  try {
    const result = await client.query(
      `WITH del AS (
         DELETE FROM tasks WHERE id=$1 AND project_id IN (
           SELECT p.id FROM projects p JOIN workspace_members wm ON p.workspace_id = wm.workspace_id WHERE wm.user_id = $2
         ) RETURNING *
       )
       SELECT del.*, p.workspace_id FROM del JOIN projects p ON p.id = del.project_id`,
      [id, user_id],
    );
    return result.rows[0];
  } catch (error) {
    console.error("error occurred", error);
    throw error;
  }
};
