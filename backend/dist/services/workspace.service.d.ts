export declare const createWorkspaceService: (name: string, owner_id: number) => Promise<any>;
export declare const getAllWorkspaceService: (userId: number) => Promise<any[]>;
export declare const getWorkspaceByIdService: (workspace_id: string, user_id: number) => Promise<any>;
export declare const deleteWorkspaceService: (workspace_id: string, owner_id: number) => Promise<any>;
export declare const joinWorkspaceService: (userId: number, workspaceId: number) => Promise<{
    workspace_id: number;
    user_id: number;
    role: any;
} | null>;
//# sourceMappingURL=workspace.service.d.ts.map