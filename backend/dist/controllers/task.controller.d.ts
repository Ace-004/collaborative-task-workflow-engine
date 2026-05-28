import type { NextFunction, Request, Response } from "express";
export declare const createTask: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllTask: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const getTaskById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteTask: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const decomposeTaskWithAI: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=task.controller.d.ts.map