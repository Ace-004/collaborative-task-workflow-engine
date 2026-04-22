import { pool } from "../pool.js";

export const createUserQuery = async (
  email: string,
  password_hash: string,
) => {
  const result = await pool.query(
    "INSERT INTO users (email,password_hash) values ($1,$2) RETURNING id,email",
    [email, password_hash],
  );
  return result.rows[0];
};

export const getUserQuery=async(email:string)=>{
  const result = await pool.query("SELECT * FROM users WHERE email=$1",[email]);
  return result.rows[0];
}