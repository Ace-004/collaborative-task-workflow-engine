import type { NextFunction, Request, Response } from "express";
import { createProjectQuery, deleteProjectQuery, getAllProjectsQuery, getProjectByIdQuery } from "../db/queries/project.query.js";
import { AppError } from "../middleware/error.middleware.js";

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  const { name, workspace_id } = req.body;
  const owner = req.user;

  if (!name || !workspace_id) {
    return next(new AppError(400, "Project name and workspace ID are required"));
  }

  try {
    if (typeof owner !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    const project = await createProjectQuery(name, workspace_id, owner);
    if (!project) {
      return next(new AppError(403, "Unauthorized or workspace not found"));
    }
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  const { workspace_id } = req.query as { workspace_id: string };
  if (!workspace_id || isNaN(Number(workspace_id))) {
    return next(new AppError(400, "Workspace ID is required and must be a number"));
  }

  try {
    const projects = await getAllProjectsQuery(Number(workspace_id));
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return next(new AppError(400, "Invalid project ID format"));
  }

  try {
    const project = await getProjectByIdQuery(id);
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const owner = req.user;

  if (typeof id !== "string") {
    return next(new AppError(400, "Project ID is required and must be a string"));
  }

  try {
    if (typeof owner !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    const project = await deleteProjectQuery(id, owner);
    if (!project) {
      return next(new AppError(403, "Unauthorized or project not found"));
    }
    res.status(200).json({ success: true, message: "project deleted successfully" });
  } catch (error) {
    next(error);
  }
};