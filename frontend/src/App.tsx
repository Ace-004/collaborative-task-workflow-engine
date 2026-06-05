import { useState, useEffect, useRef } from "react";
import type { User, Workspace, Project, Task, WorkspaceMember } from "./types";
import { apiGet, apiPost, apiDelete } from "./api";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TaskBoard from "./components/TaskBoard";
import AIDecompose from "./components/AIDecompose";

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // App data state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Loading states
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspaceMembersLoading, setWorkspaceMemersLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Check auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("taskflow_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("taskflow_user");
      }
    }
  }, []);

  // Fetch workspaces when user logged in
  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      if (wsRef.current) {
        wsRef.current.close();
      }
    }
  }, [user]);

  // Fetch projects when workspace is selected
  useEffect(() => {
    if (selectedWorkspace) {
      fetchProjects(selectedWorkspace.id);
      fetchWorkSpaceMembers(selectedWorkspace.id);
      connectWebSocket(selectedWorkspace.id);
    } else {
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      if (wsRef.current) {
        wsRef.current.close();
      }
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedWorkspace]);

  // Fetch tasks when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject.id);
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  // WebSocket setup
  const connectWebSocket = (workspaceId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:3000/`;

    console.log("Connecting WebSocket to:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to workspace:", workspaceId);
      setWsConnected(true);
      ws.send(JSON.stringify({ type: "join-workspace", workspaceId }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WS Event received:", message);
        const { event: evType, data } = message;

        if (evType === "task_created") {
          const task = data.task;
          if (selectedProject && task.project_id === selectedProject.id) {
            setTasks((prev) => {
              if (prev.some((t) => t.id === task.id)) return prev;
              return [...prev, task];
            });
          }
        } else if (evType === "task_deleted") {
          const { taskId } = data;
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
        }
      } catch (err) {
        console.error("Error processing WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setWsConnected(false);
    };
  };

  // API operations
  const fetchWorkspaces = async () => {
    setWorkspacesLoading(true);
    try {
      const json = await apiGet<Workspace[]>("/workspace");
      if (json.success) {
        setWorkspaces(json.data);
        if (json.data.length > 0 && !selectedWorkspace)
          setSelectedWorkspace(json.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
    } finally {
      setWorkspacesLoading(false);
    }
  };

  const fetchWorkSpaceMembers=async(id:number)=>{
    setWorkspaceMemersLoading(true);
    try {
      const json = await apiGet<WorkspaceMember[]>(`/workspace/members/${id}`);
      if (json.success) {
        setWorkspaceMembers(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
    } finally {
      setWorkspacesLoading(false);
    }
  }

  const handleWorkspaceJoined = async () => {
    // Refresh workspaces list after joining
    await fetchWorkspaces();
    
  };

  const handleCreateWorkspace = async (name: string) => {
    try {
      const json = await apiPost<Workspace>("/workspace/create", { name });
      if (json.success && json.data) {
        setWorkspaces((prev) => [...prev, json.data]);
        setSelectedWorkspace(json.data);
      }
    } catch (err) {
      console.error("Failed to create workspace", err);
    }
  };

  const handleDeleteWorkspace = async (id: number) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;
    try {
      const json = await apiDelete<void>(`/workspace/${id}`);
      if (json.success) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        if (selectedWorkspace?.id === id) setSelectedWorkspace(null);
      }
    } catch (err) {
      console.error("Failed to delete workspace", err);
    }
  };

  const fetchProjects = async (workspaceId: number) => {
    setProjectsLoading(true);
    try {
      const json = await apiGet<Project[]>(
        `/project?workspace_id=${workspaceId}`,
      );
      if (json.success) {
        setProjects(json.data);
        setSelectedProject(json.data.length > 0 ? json.data[0] : null);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    if (!selectedWorkspace) return;
    try {
      const json = await apiPost<Project>("/project/create", {
        name,
        workspace_id: selectedWorkspace.id,
      });
      if (json.success && json.data) {
        setProjects((prev) => [...prev, json.data]);
        setSelectedProject(json.data);
      }
    } catch (err) {
      console.error("Failed to create project", err);
      SpeechSynthesisErrorEvent
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const json = await apiDelete<void>(`/project/${id}`);
      if (json.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProject?.id === id) setSelectedProject(null);
      }
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const fetchTasks = async (projectId: number) => {
    setTasksLoading(true);
    try {
      const json = await apiGet<Task[]>(`/task?project_id=${projectId}`);
      if (json.success) setTasks(json.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTask = async (
    title: string,
    description: string,
    priority: string,
    assignedUserId: number,
  ) => {
    if (!selectedProject || !selectedWorkspace) return;
    try {
      const json = await apiPost<Task>("/task/create", {
        title,
        description,
        priority,
        project_id: selectedProject.id,
        assigned_user_id: assignedUserId,
        workspace_id: selectedWorkspace.id,
      });
      if (json.success && json.data) {
        setTasks((prev) =>
          prev.some((t) => t.id === json.data.id) ? prev : [...prev, json.data],
        );
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    if (!selectedWorkspace) return;
    try {
      const json = await apiDelete<void>(`/task/${id}`, {
        workspace_id: selectedWorkspace.id,
      });
      if (json.success) setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleDecomposedTask = async (taskData: {
    title: string;
    description: string;
    priority?: string;
  }) => {
    if (!selectedProject || !selectedWorkspace) return;
    try {
      const json = await apiPost<Task>("/task/create", {
        title: taskData.title,
        description: taskData.description || "",
        priority: taskData.priority || "medium",
        project_id: selectedProject.id,
        assigned_user_id: user?.id,
        workspace_id: selectedWorkspace.id,
      });
      if (json.success && json.data) {
        setTasks((prev) =>
          prev.some((t) => t.id === json.data.id) ? prev : [...prev, json.data],
        );
      }
    } catch (err) {
      console.error("Failed to add AI decomposed task", err);
    }
  };

  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem("taskflow_user", JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("taskflow_user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        userEmail={user.email}
        wsConnected={wsConnected}
        onLogout={handleLogout}
      />

      {/* Main Work Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          user={user}
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          setSelectedWorkspace={setSelectedWorkspace}
          projects={projects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          workspacesLoading={workspacesLoading}
          projectsLoading={projectsLoading}
          onCreateWorkspace={handleCreateWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onWorkspaceJoined={handleWorkspaceJoined}
        />

        {/* Central Dashboard View */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {!selectedWorkspace ? (
            <div className="h-96 flex items-center justify-center text-slate-500 italic">
              Please select or create a workspace on the left panel to begin.
            </div>
          ) : !selectedProject ? (
            <div className="h-96 flex items-center justify-center text-slate-500 italic">
              Please select or create a project to start viewing tasks.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TaskBoard
                selectedProject={selectedProject}
                tasks={tasks}
                tasksLoading={tasksLoading}
                onCreateTask={handleCreateTask}
                onDeleteTask={handleDeleteTask}
                workspaceMembers={workspaceMembers}
                workspaceMembersLoading={workspaceMembersLoading}
              />
              <AIDecompose onAddDecomposedTask={handleDecomposedTask} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
