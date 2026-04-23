import type { Request,Response } from "express";
import { createTaskService, deleteTaskService } from "../services/task.service.js";
import { getAllTasksQuery, getTaskByIdQuery } from "../db/queries/task.query.js";

export const createTask = async (req: Request, res: Response) => {
  const { title,
    description,
    priority,
    project_id,
    assigned_user_id } = req.body;
  const user = req.user;
  try {
    if (typeof user === "number") {
      const task = await createTaskService(title, description, priority, project_id, assigned_user_id, user);
      if (!task) return res.status(403).json({ success: false, message: "Unauthorized or project not found" });
      res.status(201).json({ success: true, data: task });
    }
  } catch (error) {
    console.error('error occurred', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllTask = async (req: Request, res: Response) => {
  const { project_id } = req.query as { project_id: string };
  try {
    const tasks = await getAllTasksQuery(Number(project_id));
    res.status(200).json({ success: true, data: tasks })
  } catch (error) {
    console.error('error occurred', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getTaskById = async(req:Request,res:Response)=>{
  const id=req.params.id;
  try {
    const task =await getTaskByIdQuery((id as any));
    res.status(200).json({success:true,data:task});    
  } catch (error) {
    console.error('error occurred', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const deleteTask = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user;
  try {
    if (typeof user === "number") {
      const task = await deleteTaskService(Number(id), user);
      res.status(200).json({ success: true, message: "task deleted successfully" });
    }
  } catch (error) {
    console.error('error occurred', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}