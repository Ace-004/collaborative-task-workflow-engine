import { createWorkspaceQuery, deleteWorkspaceQuery, getWorkspaceByIdQuery, getWorkspaceQuery } from "../db/queries/workspace.query.js"

export const createWorkspaceService=async(name:string,owner_id:number)=>{
  return await createWorkspaceQuery(name,owner_id);
};

export const getAllWorkspaceService= async(userId:number)=>{
  return await getWorkspaceQuery(userId);
}

export const getWorkspaceByIdService=async(workspace_id:string,user_id:number)=>{
  return await getWorkspaceByIdQuery(workspace_id,user_id);
}

export const deleteWorkspaceService=async(workspace_id:string,owner_id:number)=>{
  return await deleteWorkspaceQuery(workspace_id,owner_id);
}