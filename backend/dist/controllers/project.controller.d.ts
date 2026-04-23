import type { Request, Response } from "express";
export declare const createProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllProjects: (req: Request, res: Response) => Promise<void>;
export declare const getProjectById: (req: Request, res: Response) => Promise<void>;
export declare const deleteProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=project.controller.d.ts.map