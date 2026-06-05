import {
  createWorkspaceQuery,
  deleteWorkspaceQuery,
  getWorkspaceByIdQuery,
  getWorkspaceQuery,
  joinWorkspaceQuery,
  getAllAvailableWorkspacesQuery,
  getWorkspaceMembersQuery,
} from "../db/queries/workspace.query.js";

export const createWorkspaceService = async (
  name: string,
  owner_id: number,
) => {
  return await createWorkspaceQuery(name, owner_id);
};

export const getAllWorkspaceService = async (userId: number) => {
  return await getWorkspaceQuery(userId);
};

export const getWorkspaceByIdService = async (
  workspace_id: string,
  user_id: number,
) => {
  return await getWorkspaceByIdQuery(workspace_id, user_id);
};

export const deleteWorkspaceService = async (
  workspace_id: string,
  owner_id: number,
) => {
  return await deleteWorkspaceQuery(workspace_id, owner_id);
};

export const joinWorkspaceService = async (
  userId: number,
  workspaceId: number,
) => {
  return await joinWorkspaceQuery(userId, workspaceId);
};

export const getAllAvailableWorkspacesService = async () => {
  return await getAllAvailableWorkspacesQuery();
};

export const getWorkspaceMembersService = async (workspace_id: number) => {
  return await getWorkspaceMembersQuery(workspace_id);
};
