import { pool } from "../pool.js";

export const createUserQuery = async (
  email: string,
  password_hash: string,
) => {
  const result = await pool.query(
    "INSERT INTO users (email,password_hash) values ($1,$2)",
    [email, password_hash],
  );
  return result.rows[0];
};
