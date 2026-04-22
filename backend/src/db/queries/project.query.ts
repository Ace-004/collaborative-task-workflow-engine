import {pool} from '../pool.js';

export const createProjectQuery=async(name:string,workspace_id:number)=>{
  const result = await pool.query("INSERT INTO projects (name,workspace_id) values ($1,$2) RETURNING *",[name,workspace_id]);
  return result.rows[0];
}

export const getAllProjectsQuery= async(workspace_id:string)=>{
  const result=await pool.query("SELECT * FROM projects WHERE workspace_id = $1",[workspace_id]);
  return result.rows;
}

export const getProjectByIdQuery=async(id:string)=>{
  const result=await pool.query("SELECT * FROM projects WHERE id = $1",[id]);
  return result.rows[0];
}

export const deleteProjectQuery=async(id:string)=>{
  const result = await pool.query("DELETE FROM projects WHERE id=$1",[id]);
  return result.rows[0];
}