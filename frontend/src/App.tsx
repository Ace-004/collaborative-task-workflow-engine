import React, { useState, useEffect, useRef } from "react";
import { apiDelete, apiGet, apiPost } from "./api";

interface Workspace {
  id: number;
  name: string;
  owner_id: number;
}

interface Project {
  id: number;
  name: string;
  workspace_id: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  project_id: number;
  assigned_user_id: number;
  status?: string;
}

export default function App() {
  // Auth state
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // App data state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const selectedProjectRef = useRef<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Loading states
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Forms states
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [joinWorkspaceId, setJoinWorkspaceId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskAssignedUser, setNewTaskAssignedUser] = useState("1");

  // AI Decompose state
  const [aiRequirements, setAiRequirements] = useState("");
  const [aiDecomposing, setAiDecomposing] = useState(false);
  const [aiResult, setAiResult] = useState<any[] | null>(null);

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Check auth on mount
  useEffect(() => {
    // Try to load user from localStorage if saved or make request to check login state
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
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  // WebSocket setup
  const connectWebSocket = (workspaceId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsBaseUrl =
      import.meta.env.VITE_WS_BASE_URL?.trim() || "ws://localhost:3000";
    const wsUrl = `${wsBaseUrl}/ws`;

    console.log("Connecting WebSocket to:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to workspace:", workspaceId);
      setWsConnected(true);
      // Join room for this workspace
      ws.send(JSON.stringify({ type: "join-workspace", workspaceId }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WS Event received:", message);
        const { event: evType, data } = message;
        if (evType === "task_created") {
          // Always read the most recent selected project from ref
          const task = data.task;
          const currentSelectedProject = selectedProjectRef.current;
          if (
            currentSelectedProject &&
            task.project_id === currentSelectedProject.id
          ) {
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
      if (json.success && Array.isArray(json.data)) {
        setWorkspaces(json.data);
        if (json.data.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(json.data[0]);
        }
        return json.data;
      }
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
    } finally {
      setWorkspacesLoading(false);
    }

    return [] as Workspace[];
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const json = await apiPost<Workspace>("/workspace/create", {
        name: newWorkspaceName,
      });
      if (json.success && json.data) {
        setWorkspaces((prev) => [...prev, json.data]);
        setSelectedWorkspace(json.data);
        setNewWorkspaceName("");
      }
    } catch (err) {
      console.error("Failed to create workspace", err);
    }
  };

  const joinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinWorkspaceId.trim()) return;

    try {
      const json = await apiPost<{
        workspace_id: number;
        user_id: number;
        role: string;
      }>("/workspace/join", { workspace_id: Number(joinWorkspaceId) });

      if (json.success) {
        const joinedId = Number(joinWorkspaceId);
        const latestWorkspaces = await fetchWorkspaces();
        setJoinWorkspaceId("");
        const joinedWorkspace = latestWorkspaces.find(
          (workspace) => workspace.id === joinedId,
        );
        if (joinedWorkspace) {
          setSelectedWorkspace(joinedWorkspace);
        }
      }
    } catch (err) {
      console.error("Failed to join workspace", err);
    }
  };

  const deleteWorkspace = async (id: number) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;
    try {
      const json = await apiDelete<null>(`/workspace/${id}`);
      if (json.success) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        if (selectedWorkspace?.id === id) {
          setSelectedWorkspace(null);
        }
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
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
        if (json.data.length > 0) {
          setSelectedProject(json.data[0]);
        } else {
          setSelectedProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedWorkspace) return;
    try {
      const json = await apiPost<Project>("/project/create", {
        name: newProjectName,
        workspace_id: selectedWorkspace.id,
      });
      if (json.success && json.data) {
        setProjects((prev) => [...prev, json.data]);
        setSelectedProject(json.data);
        setNewProjectName("");
      }
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const json = await apiDelete<null>(`/project/${id}`);
      if (json.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProject?.id === id) {
          setSelectedProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const fetchTasks = async (projectId: number) => {
    setTasksLoading(true);
    try {
      const json = await apiGet<Task[]>(`/task?project_id=${projectId}`);
      if (json.success && Array.isArray(json.data)) {
        setTasks(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject || !selectedWorkspace) return;
    try {
      const json = await apiPost<Task>("/task/create", {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        project_id: selectedProject.id,
        assigned_user_id: Number(newTaskAssignedUser),
        workspace_id: selectedWorkspace.id, // Needed for websocket broadcast
      });
      if (json.success && json.data) {
        // Appending task locally (though WS might also receive it, state management avoids duplicate)
        setTasks((prev) => {
          if (prev.some((t) => t.id === json.data.id)) return prev;
          return [...prev, json.data];
        });
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskPriority("medium");
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    if (!selectedWorkspace) return;
    try {
      const json = await apiDelete<null>(`/task/${id}`, {
        workspace_id: selectedWorkspace.id, // For WS broadcast mapping
      });
      if (json.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  // AI Decompose request
  const handleAIDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiRequirements.trim()) return;
    setAiDecomposing(true);
    setAiResult(null);
    try {
      const json = await apiPost<any[]>("/task/ai-decompose", {
        requirements: aiRequirements,
      });
      if (json.success && Array.isArray(json.data)) {
        setAiResult(json.data);
      }
    } catch (err) {
      console.error("AI Decompose failed", err);
    } finally {
      setAiDecomposing(false);
    }
  };

  // Bulk add decomposed tasks
  const addDecomposedTask = async (taskData: {
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
        assigned_user_id: 1, // Default user
        workspace_id: selectedWorkspace.id,
      });
      if (json.success && json.data) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === json.data.id)) return prev;
          return [...prev, json.data];
        });
        // Remove from AI list
        setAiResult((prev) =>
          prev ? prev.filter((t) => t.title !== taskData.title) : null,
        );
      }
    } catch (err) {
      console.error("Failed to add AI decomposed task", err);
    }
  };

  // Login/Register operation
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Email and Password are required");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    try {
      const json = await apiPost<{ id: number; email?: string }>(endpoint, {
        email: authEmail,
        password: authPassword,
      });
      if (json.success && json.data) {
        const loggedUser = {
          id: json.data.id,
          email: json.data.email || authEmail,
        };
        setUser(loggedUser);
        localStorage.setItem("taskflow_user", JSON.stringify(loggedUser));
        setAuthEmail("");
        setAuthPassword("");
      } else {
        setAuthError(json.message || "Authentication failed");
      }
    } catch (err) {
      setAuthError("Failed to connect to backend server");
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("taskflow_user");
    // Clear cookies manually
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
            TF
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            {isRegister ? "Create your account" : "Sign in to TaskFlow"}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Collaborative task and workflow engine
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/50 backdrop-blur-md py-8 px-4 border border-slate-800 shadow-2xl rounded-2xl sm:px-10">
            <form className="space-y-6" onSubmit={handleAuth}>
              {authError && (
                <div className="rounded-lg bg-red-950/50 border border-red-500/50 p-4 text-sm text-red-200">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150 ease-in-out cursor-pointer"
                >
                  {authLoading
                    ? "Processing..."
                    : isRegister
                      ? "Sign Up"
                      : "Sign In"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none cursor-pointer"
              >
                {isRegister
                  ? "Already have an account? Sign In"
                  : "Need a new account? Register"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-500/20">
            TF
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TaskFlow Dashboard
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                wsConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="text-slate-400">
              {wsConnected ? "WebSocket Connected" : "Real-time Offline"}
            </span>
          </div>

          <span className="text-sm text-slate-300 hidden sm:inline">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Navigation Panel: Workspaces and Projects */}
        <aside className="w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col p-4 space-y-6 overflow-y-auto">
          {/* Workspaces Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Workspaces
              </h3>
            </div>

            {/* Create Workspace Form */}
            <form onSubmit={createWorkspace} className="flex gap-2">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="New Workspace..."
                className="flex-1 px-3 py-1.5 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium cursor-pointer"
              >
                +
              </button>
            </form>

            <form onSubmit={joinWorkspace} className="flex gap-2">
              <input
                type="number"
                value={joinWorkspaceId}
                onChange={(e) => setJoinWorkspaceId(e.target.value)}
                placeholder="Workspace ID to join"
                className="flex-1 px-3 py-1.5 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-emerald-500 text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer"
              >
                Join
              </button>
            </form>

            {/* Workspace list */}
            {workspacesLoading ? (
              <div className="text-sm text-slate-500">
                Loading workspaces...
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-sm text-slate-500 italic">
                No workspaces found
              </div>
            ) : (
              <div className="space-y-1.5">
                {workspaces.map((w) => (
                  <div
                    key={w.id}
                    className={`flex items-center justify-between group p-2 rounded-lg text-sm cursor-pointer transition ${
                      selectedWorkspace?.id === w.id
                        ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/10"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                    onClick={() => setSelectedWorkspace(w)}
                  >
                    <span className="truncate">{w.name}</span>
                    {w.owner_id === user.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkspace(w.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-xs p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-800" />

          {/* Projects Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Projects
            </h3>

            {selectedWorkspace ? (
              <>
                {/* Create Project Form */}
                <form onSubmit={createProject} className="flex gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New Project..."
                    className="flex-1 px-3 py-1.5 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium cursor-pointer"
                  >
                    +
                  </button>
                </form>

                {/* Projects list */}
                {projectsLoading ? (
                  <div className="text-sm text-slate-500">
                    Loading projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-sm text-slate-500 italic">
                    No projects in workspace
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between group p-2 rounded-lg text-sm cursor-pointer transition ${
                          selectedProject?.id === p.id
                            ? "bg-slate-800 text-white font-medium border-l-2 border-indigo-500"
                            : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                        }`}
                        onClick={() => setSelectedProject(p)}
                      >
                        <span className="truncate">{p.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(p.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-xs p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-500 italic">
                Select a workspace first
              </div>
            )}
          </div>
        </aside>

        {/* Central Dashboard View: Tasks list & AI Decompose tools */}
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
              {/* Left 2 Cols: Task Board / List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedProject.name}
                    </h2>
                    <p className="text-sm text-slate-400">
                      Manage tasks and assignments
                    </p>
                  </div>
                </div>

                {/* Create Task Form */}
                <form
                  onSubmit={createTask}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"
                >
                  <h4 className="text-sm font-semibold text-slate-200">
                    Create New Task
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Task Title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="px-3 py-2 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white w-full"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="px-3 py-2 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white w-full"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Task Description..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    rows={2}
                    className="px-3 py-2 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white w-full resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        Assign User ID:
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={newTaskAssignedUser}
                        onChange={(e) => setNewTaskAssignedUser(e.target.value)}
                        className="w-16 px-2 py-1 text-sm rounded bg-slate-950 border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition cursor-pointer"
                    >
                      Add Task
                    </button>
                  </div>
                </form>

                {/* Tasks List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Task List ({tasks.length})
                  </h3>

                  {tasksLoading ? (
                    <div className="text-slate-500">Loading tasks...</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-slate-500 italic p-6 bg-slate-900/20 border border-slate-850 rounded-xl text-center">
                      No tasks found in this project. Create one or use AI below
                      to generate tasks!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start hover:border-slate-700 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold text-white text-base">
                                {task.title}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  task.priority === "high"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    : task.priority === "medium"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-slate-400">
                                {task.description}
                              </p>
                            )}
                            <div className="text-xs text-indigo-400 pt-1">
                              Assigned to User #{task.assigned_user_id}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: AI Task Decomposition tool */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    ✨ Gemini Task Decomposition
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Describe a complex requirement and AI will break it down
                    into clean, structured sub-tasks.
                  </p>
                </div>

                <form onSubmit={handleAIDecompose} className="space-y-3">
                  <textarea
                    required
                    value={aiRequirements}
                    onChange={(e) => setAiRequirements(e.target.value)}
                    placeholder="Describe requirement, e.g.: Create React registration form with client-side validation and responsive dashboard CSS."
                    rows={4}
                    className="px-3 py-2 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white w-full resize-none"
                  />
                  <button
                    type="submit"
                    disabled={aiDecomposing}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded font-bold text-sm shadow-lg disabled:opacity-50 transition cursor-pointer"
                  >
                    {aiDecomposing
                      ? "Generating Tasks..."
                      : "Decompose with AI"}
                  </button>
                </form>

                {/* AI Results list */}
                {aiResult && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      AI Generated Tasks ({aiResult.length})
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {aiResult.map((sub, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 p-3 rounded-lg border border-slate-855 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-semibold text-white block">
                              {sub.title}
                            </span>
                            <p className="text-slate-400 leading-normal">
                              {sub.description}
                            </p>
                            {sub.priority && (
                              <span className="text-[9px] uppercase font-bold text-slate-500">
                                Priority: {sub.priority}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addDecomposedTask(sub)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer shrink-0"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
