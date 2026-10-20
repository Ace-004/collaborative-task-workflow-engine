import type { NextFunction, Request, Response } from "express";
import {
  createTaskService,
  deleteTaskService,
} from "../services/task.service.js";
import {
  getAllTasksQuery,
  getTaskByIdQuery,
  isProjectMemberQuery,
} from "../db/queries/task.query.js";
import { AppError } from "../middleware/error.middleware.js";
import { cacheDelete, cacheGet, cacheSet } from "../services/redis.service.js";
import { broadcastToWorkspace } from "../services/websocket.service.js";
import { decomposeRequirementWithAI } from "../services/gemini.service.js";

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { title, description, priority, project_id, assigned_user_id } =
    req.body;
  const user = req.user;

  if (!title || !project_id || typeof title !== "string") {
    return next(new AppError(400, "Task title and project ID are required"));
  }
  if (title.length > 200 || (typeof description === "string" && description.length > 5000)) {
    return next(new AppError(400, "Title or description too long"));
  }
  if (isNaN(Number(project_id))) {
    return next(new AppError(400, "Project ID must be a number"));
  }
  const assignee =
    assigned_user_id === undefined || assigned_user_id === null || assigned_user_id === ""
      ? null
      : Number(assigned_user_id);
  if (assignee !== null && isNaN(assignee)) {
    return next(new AppError(400, "assigned_user_id must be a number"));
  }

  try {
    if (typeof user === "number") {
      const task = await createTaskService(
        title,
        description,
        priority,
        Number(project_id),
        assignee,
        user,
      );
      if (!task)
        return next(new AppError(403, "Unauthorized or project not found"));
      if (task) {
        await cacheDelete(`project:${project_id}:tasks`);
        // use the workspace derived from the DB, never one supplied by the client
        broadcastToWorkspace(task.workspace_id, "task_created", {
          task,
          creatorId: user,
        });
      }
      res.status(201).json({ success: true, data: task });
    } else {
      return next(new AppError(401, "User ID not found in session"));
    }
  } catch (error) {
    next(error);
  }
};

export const getAllTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { project_id } = req.query as { project_id: string };
  if (!project_id || isNaN(Number(project_id))) {
    return next(
      new AppError(400, "Project ID is required and must be a number"),
    );
  }

  const projectId = Number(project_id);
  const userId = req.user;
  if (typeof userId !== "number") {
    return next(new AppError(401, "User ID not found in session"));
  }
  const cacheKey = `project:${projectId}:tasks`;

  try {
    // Authorization must run before the cache lookup, otherwise cached data bypasses it.
    if (!(await isProjectMemberQuery(projectId, userId))) {
      return next(new AppError(404, "Project not found"));
    }
    const cachedTasks = await cacheGet<any[]>(cacheKey);
    if (cachedTasks)
      return res
        .status(200)
        .json({ success: true, fromCache: true, data: cachedTasks });
    const tasks = await getAllTasksQuery(Number(project_id));
    await cacheSet(cacheKey, tasks, 300);
    res.status(200).json({ success: true, fromCache: false, data: tasks });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return next(new AppError(400, "Invalid task ID format"));
  }

  try {
    if (typeof req.user !== "number") {
      return next(new AppError(401, "User ID not found in session"));
    }
    const task = await getTaskByIdQuery(id, req.user);
    if (!task) {
      return next(new AppError(404, "Task not found"));
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  const user = req.user;

  if (isNaN(id)) {
    return next(new AppError(400, "Invalid task ID format"));
  }

  try {
    if (typeof user === "number") {
      const task = await deleteTaskService(id, user);
      if (!task)
        return next(new AppError(403, "Unauthorized or task not found"));
      if (task) {
        await cacheDelete(`project:${task.project_id}:tasks`);
        broadcastToWorkspace(task.workspace_id, "task_deleted", {
          taskId: id,
          deletedBy: user,
        });
      }
      res
        .status(200)
        .json({ success: true, message: "task deleted successfully" });
    } else {
      return next(new AppError(401, "User ID not found in session"));
    }
  } catch (error) {
    next(error);
  }
};

export const decomposeTaskWithAI = async (req: Request, res: Response, next: NextFunction) => {
  const { requirements } = req.body;

  if (!requirements || typeof requirements !== "string") {
    return next(new AppError(400, "Requirements text description is required"));
  }

  try {
    const tasks = await decomposeRequirementWithAI(requirements);
    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};
