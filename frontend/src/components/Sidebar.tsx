import React, { useState } from "react";
import type { User, Workspace, Project } from "../types";
import JoinWorkspaceModal from "./JoinWorkspaceModal";

interface SidebarProps {
  user: User;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (w: Workspace | null) => void;
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (p: Project | null) => void;
  workspacesLoading: boolean;
  projectsLoading: boolean;
  onCreateWorkspace: (name: string) => Promise<void>;
  onDeleteWorkspace: (id: number) => Promise<void>;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
  onWorkspaceJoined: () => void;
}

export default function Sidebar({
  user,
  workspaces,
  selectedWorkspace,
  setSelectedWorkspace,
  projects,
  selectedProject,
  setSelectedProject,
  workspacesLoading,
  projectsLoading,
  onCreateWorkspace,
  onDeleteWorkspace,
  onCreateProject,
  onDeleteProject,
  onWorkspaceJoined,
}: SidebarProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    onCreateWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName("");
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName("");
  };

  const handleWorkspaceJoined = () => {
    setShowJoinModal(false);
    onWorkspaceJoined();
  };

  return (
    <aside className="w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col p-4 space-y-6 overflow-y-auto">
      {/* Workspaces Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Workspaces
          </h3>
          <button
            onClick={() => setShowJoinModal(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-medium cursor-pointer"
            title="Join an existing workspace"
          >
            Join
          </button>
        </div>

        {/* Create Workspace Form */}
        <form onSubmit={handleWorkspaceSubmit} className="flex gap-2">
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

        {/* Workspace list */}
        {workspacesLoading ? (
          <div className="text-sm text-slate-500">Loading workspaces...</div>
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
                      onDeleteWorkspace(w.id);
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
            <form onSubmit={handleProjectSubmit} className="flex gap-2">
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
              <div className="text-sm text-slate-500">Loading projects...</div>
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
                        onDeleteProject(p.id);
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

      <JoinWorkspaceModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        userWorkspaceIds={workspaces.map((w) => w.id)}
        onWorkspaceJoined={handleWorkspaceJoined}
      />
    </aside>
  );
}
