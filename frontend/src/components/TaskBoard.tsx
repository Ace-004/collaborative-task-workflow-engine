import React, { useState } from "react";
import type { Project, Task, WorkspaceMember } from "../types";

interface TaskBoardProps {
  selectedProject: Project;
  tasks: Task[];
  tasksLoading: boolean;
  onCreateTask: (title: string, description: string, priority: string, assignedUserId: number) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  workspaceMembers:WorkspaceMember[];
  workspaceMembersLoading: boolean;
}

export default function TaskBoard({
  selectedProject,
  tasks,
  tasksLoading,
  onCreateTask,
  onDeleteTask,
  workspaceMembers,
}: TaskBoardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskAssignedUser, setNewTaskAssignedUser] = useState(workspaceMembers[0].user_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateTask(
      newTaskTitle.trim(),
      newTaskDesc.trim(),
      newTaskPriority,
      Number(newTaskAssignedUser)
    );
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("medium");
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
          <p className="text-sm text-slate-400">Manage tasks and assignments</p>
        </div>
      </div>

      {/* Create Task Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"
      >
        <h4 className="text-sm font-semibold text-slate-200">Create New Task</h4>
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
            <span className="text-xs text-slate-400">Assign User :</span>
            <select value={newTaskAssignedUser} onChange={(e)=>setNewTaskAssignedUser((e.target.value)as any)}
              className="px-3 py-2 text-sm rounded bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-white w-full"
              >
              {/* <option value="">select user</option> */}
              {workspaceMembers.map((m)=><option  value={`${m.user_id}`}>
              {`${m.email}`}

              </option>
            )
            }
              
            </select>
            {/* <input
              type="number"
              min="1"
              value={newTaskAssignedUser}
              onChange={(e) => setNewTaskAssignedUser(e.target.value)}
              className="w-16 px-2 py-1 text-sm rounded bg-slate-950 border border-slate-800 text-white focus:outline-none"
            /> */}
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
            No tasks found in this project. Create one or use AI below to generate tasks!
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
                    <span className="font-semibold text-white text-base">{task.title}</span>
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
                    <p className="text-sm text-slate-400">{task.description}</p>
                  )}
                  <div className="text-xs text-indigo-400 pt-1">
                    Assigned to User #{task.assigned_user_id}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
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
  );
}
