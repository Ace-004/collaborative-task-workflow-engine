export declare const createWorkspaceQuery: (name: string, owner_id: number) => Promise<any>;
export declare const getWorkspaceQuery: (userId: number) => Promise<any[]>;
export declare const getWorkspaceByIdQuery: (workspace_id: string, user_id: number) => Promise<any>;
export declare const deleteWorkspaceQuery: (workspace_id: string, owner_id: number) => Promise<any>;
export declare const joinWorkspaceQuery: (user_id: number, workspace_id: number) => Promise<{
    workspace_id: number;
    user_id: number;
    role: any;
} | null>;
export declare const getAllAvailableWorkspacesQuery: () => Promise<any[]>;
export declare const getWorkspaceMembersQuery: (workspace_id: number) => Promise<any[]>;
//# sourceMappingURL=workspace.query.d.ts.map