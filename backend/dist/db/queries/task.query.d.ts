import type { PoolClient } from "pg";
export declare const createTaskQuery: (title: string, description: string, priority: string | null | undefined, project_id: number, assigned_user_id: number, user_id: number, client: PoolClient) => Promise<any>;
export declare const getAllTasksQuery: (project_id: number) => Promise<any[]>;
export declare const getTaskByIdQuery: (id: number) => Promise<any>;
export declare const deleteTaskQuery: (id: number, user_id: number, client: PoolClient) => Promise<any>;
//# sourceMappingURL=task.query.d.ts.map