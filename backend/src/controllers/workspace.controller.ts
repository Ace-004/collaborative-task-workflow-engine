import type { Request,Response } from "express";
import { createWorkspaceService, deleteWorkspaceService, getAllWorkspaceService, getWorkspaceByIdService } from "../services/workspace.service.js";

export const createWorkspace=async(req:Request,res:Response)=>{
  const {name} =req.body;
  const owner_id=req.user;

  try {
    if(!owner_id)throw new Error("no user id");
    if(typeof owner_id === "number"){
      const workspace=createWorkspaceService(name,owner_id);
      res.status(201).json({success:true,data:workspace});
    }
  } catch (error) {
    res.status(500).json({success:false,message:"server error"+error});
  }
}

export const getAllWorkspace=async(req : Request,res : Response)=>{
  const userId=req.user;
  try {
    if(!userId)throw new Error("no user ID");
    if(typeof userId === "number"){
      const workspace=await getAllWorkspaceService(userId);
      res.status(200).json({success:true,data:workspace});
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({success:false,message:"server errror"});
  }
}

export const getWorkspaceById=async(req : Request,res: Response)=>{
  const id=req.params.id;
  const user_id=req.user;
  try {
    if(typeof id === "string" && typeof user_id === "number"){
      const workspace =await getWorkspaceByIdService(id,user_id);
      res.status(200).json({success:true,data:workspace});
    }
  } catch (error) {
    res.status(500).json({success:false,message:"server error"});
  }
}

export const deleteWorkspace=async(req:Request,res:Response)=>{
    const id=req.params.id;
  try {
    if(typeof id === "string"){
      const workspace = await deleteWorkspaceService(id);
      res.status(200).json({success:true,message:"workspace deleted successfully"});
    }
  } catch (error) {
    res.status(500).json({success:false,message:"server error"});
  }
}