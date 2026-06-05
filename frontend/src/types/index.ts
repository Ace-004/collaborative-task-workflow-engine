export interface User {
  id: number;
  email: string;
}

export interface Workspace {
  id: number;
  name: string;
  owner_id: number;
  owner_email?: string;
}

export interface WorkspaceMember {
  user_id: number;
  email: string;
  role: string;
}

export interface Project {
  id: number;
  name: string;
  workspace_id: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  project_id: number;
  assigned_user_id: number;
  status?: string;
}

export interface DecodedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimated_hours: number;
}
