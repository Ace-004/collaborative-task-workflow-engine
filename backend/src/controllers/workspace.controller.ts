import type { Request, Response, NextFunction } from "express";
import {
  createWorkspaceService,
  deleteWorkspaceService,
  getAllWorkspaceService,
  getWorkspaceByIdService,
  joinWorkspaceService,
  getAllAvailableWorkspacesService,
  getWorkspaceMembersService,
} from "../services/workspace.service.js";
import { AppError } from "../middleware/error.middleware.js";

export const createWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name } = req.body;
  const owner_id = req.user;

  if (!name) {
    return next(new AppError(400, "Workspace name is required"));
  }

  try {
    if (typeof owner_id !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    const workspace = await createWorkspaceService(name, owner_id);
    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const getAllWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user;
  try {
    if (typeof userId !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    const workspace = await getAllWorkspaceService(userId);
    res.status(200).json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id;
  const user_id = req.user;
  try {
    if (typeof user_id !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    if (typeof id !== "string") {
      return next(
        new AppError(400, "Workspace ID is required and must be a string"),
      );
    }
    const workspace = await getWorkspaceByIdService(id, user_id);
    if (!workspace) {
      return next(new AppError(404, "Workspace not found"));
    }
    res.status(200).json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id;
  const owner_id = req.user;
  try {
    if (typeof owner_id !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    if (typeof id !== "string") {
      return next(
        new AppError(400, "Workspace ID is required and must be a string"),
      );
    }
    const workspace = await deleteWorkspaceService(id, owner_id);
    if (!workspace) {
      return next(new AppError(404, "Workspace not found or unauthorized"));
    }
    res
      .status(200)
      .json({ success: true, message: "workspace deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const joinWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { workspace_id } = req.body;
  const user_id = req.user;

  if (!workspace_id) {
    return next(new AppError(400, "Workspace ID is required"));
  }

  try {
    if (typeof user_id !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }

    const joinedWorkspace = await joinWorkspaceService(
      user_id,
      Number(workspace_id),
    );

    if (!joinedWorkspace) {
      return next(new AppError(404, "Workspace not found"));
    }

    res.status(200).json({
      success: true,
      data: joinedWorkspace,
      message: "workspace joined successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAvailableWorkspaces = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaces = await getAllAvailableWorkspacesService();
    res.status(200).json({ success: true, data: workspaces });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { workspace_id } = req.params;
  const user_id = req.user;

  try {
    if (typeof user_id !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    if (!workspace_id) {
      return next(new AppError(400, "Workspace ID is required"));
    }

    const members = await getWorkspaceMembersService(Number(workspace_id));
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};
