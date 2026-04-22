import {Pool} from 'pg';

const USER:string = process.env.DB_USER || "postgres";
const HOST:string=process.env.DB_HOST || "localhost";
const DB:string=process.env.DB_NAME || "workflow_db";
const PASS :string= process.env.DB_PASS || "root";

export const pool = new Pool({
  user:USER,
  host:HOST,
  database:DB,
  password:PASS,
  port:5432,
});