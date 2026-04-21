import {Pool} from 'pg';

export const pool = new Pool({
  user:"postgres",
  host:"localhost",
  database:"workflow_db",
  password:"3091",
  port:5432,
});