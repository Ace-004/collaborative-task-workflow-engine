import type { Request, Response } from "express";
export declare const createTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllTask: (req: Request, res: Response) => Promise<void>;
export declare const getTaskById: (req: Request, res: Response) => Promise<void>;
export declare const deleteTask: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=task.controller.d.ts.map