import { createWorkspaceQuery, deleteWorkspaceQuery, getWorkspaceByIdQuery, getWorkspaceQuery, joinWorkspaceQuery, getAllAvailableWorkspacesQuery, getWorkspaceMembersQuery, } from "../db/queries/workspace.query.js";
export const createWorkspaceService = async (name, owner_id) => {
    return await createWorkspaceQuery(name, owner_id);
};
export const getAllWorkspaceService = async (userId) => {
    return await getWorkspaceQuery(userId);
};
export const getWorkspaceByIdService = async (workspace_id, user_id) => {
    return await getWorkspaceByIdQuery(workspace_id, user_id);
};
export const deleteWorkspaceService = async (workspace_id, owner_id) => {
    return await deleteWorkspaceQuery(workspace_id, owner_id);
};
export const joinWorkspaceService = async (userId, workspaceId) => {
    return await joinWorkspaceQuery(userId, workspaceId);
};
export const getAllAvailableWorkspacesService = async () => {
    return await getAllAvailableWorkspacesQuery();
};
export const getWorkspaceMembersService = async (workspace_id) => {
    return await getWorkspaceMembersQuery(workspace_id);
};
//# sourceMappingURL=workspace.service.js.map