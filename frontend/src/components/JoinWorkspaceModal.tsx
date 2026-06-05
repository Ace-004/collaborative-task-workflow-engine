import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import type { Workspace } from "../types";

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userWorkspaceIds: number[];
  onWorkspaceJoined: () => void;
}

export default function JoinWorkspaceModal({
  isOpen,
  onClose,
  userWorkspaceIds,
  onWorkspaceJoined,
}: JoinWorkspaceModalProps) {
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableWorkspaces();
    }
  }, [isOpen]);

  const fetchAvailableWorkspaces = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiGet<Workspace[]>("/workspace/available");
      if (response.success) {
        setAvailableWorkspaces(response.data);
      }
    } catch (err) {
      setError("Failed to load workspaces");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async (workspaceId: number) => {
    try {
      setJoiningId(workspaceId);
      const response = await apiPost("/workspace/join", {
        workspace_id: workspaceId,
      });
      if (response.success) {
        onWorkspaceJoined();
        setAvailableWorkspaces((prev) =>
          prev.filter((w) => w.id !== workspaceId),
        );
      }
    } catch (err) {
      setError("Failed to join workspace");
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const filteredWorkspaces = availableWorkspaces.filter(
    (w) => !userWorkspaceIds.includes(w.id),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 w-full max-w-md max-h-96 flex flex-col border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Join Workspace</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-900/20 border border-rose-700 text-rose-400 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center text-slate-400">Loading...</div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="text-center text-slate-400">
              {availableWorkspaces.length === 0
                ? "No workspaces available"
                : "You are already a member of all available workspaces"}
            </div>
          ) : (
            filteredWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded hover:bg-slate-800 border border-slate-700"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm">
                    {workspace.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Owner: {workspace.owner_email}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinWorkspace(workspace.id)}
                  disabled={joiningId === workspace.id}
                  className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white rounded font-medium cursor-pointer transition"
                >
                  {joiningId === workspace.id ? "Joining..." : "Join"}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
