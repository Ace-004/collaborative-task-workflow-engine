import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import { createTaskQuery, deleteTaskQuery } from "../db/queries/task.query.js";

export const createTaskService = async (
  title: string,
  description: string,
  priority: string | null | undefined,
  project_id: number,
  assigned_user_id: number,
  user_id: number,
) => {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await createTaskQuery(
      title,
      description,
      priority,
      project_id,
      assigned_user_id,
      user_id,
      client,
    );
    if (!result) throw new Error("Unauthorized or project not found");
    await client.query(
      "INSERT INTO activity_logs (task_id,action) values ($1,'task created') RETURNING *",
      [result.id],
    );
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("error occured", error);
    throw error;
  } finally {
    client.release();
  }
};

export const deleteTaskService = async (id: number, user_id: number) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await deleteTaskQuery(id, user_id, client);
    if (!result) throw new Error("Unauthorized or task not found");
    await client.query(
      "INSERT INTO activity_logs (task_id,action) values ($1,'task deleted')",
      [id],
    );
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("error occured", error);
    throw error;
  } finally {
    client.release();
  }
};
