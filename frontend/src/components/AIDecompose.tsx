import React, { useState } from "react";
import type { DecodedTask } from "../types";
import { apiPost } from "../api";

interface AIDecomposeProps {
  onAddDecomposedTask: (task: { title: string; description: string; priority?: string }) => Promise<void>;
}

export default function AIDecompose({ onAddDecomposedTask }: AIDecomposeProps) {
  const [aiRequirements, setAiRequirements] = useState("");
  const [aiDecomposing, setAiDecomposing] = useState(false);
  const [aiResult, setAiResult] = useState<DecodedTask[] | null>(null);

  const handleAIDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiRequirements.trim()) return;
    setAiDecomposing(true);
    setAiResult(null);
    try {
      const json = await apiPost<DecodedTask[]>("/task/ai-decompose", { requirements: aiRequirements });
      if (json.success && Array.isArray(json.data)) {
        setAiResult(json.data);
      }
    } catch (err) {
      console.error("AI Decompose failed", err);
    } finally {
      setAiDecomposing(false);
    }
  };

  const handleAddTask = async (task: DecodedTask) => {
    await onAddDecomposedTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
    });
    // Remove from AI list
    setAiResult((prev) => (prev ? prev.filter((t) => t.title !== task.title) : null));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          ✨ Gemini Task Decomposition
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Describe a complex requirement and AI will break it down into clean, structured sub-tasks.
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
          className="w-full py-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded font-bold text-sm shadow-lg disabled:opacity-50 transition cursor-pointer"
        >
          {aiDecomposing ? "Generating Tasks..." : "Decompose with AI"}
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
                className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <span className="font-semibold text-white block">{sub.title}</span>
                  <p className="text-slate-400 leading-normal">{sub.description}</p>
                  {sub.priority && (
                    <span className="text-[9px] uppercase font-bold text-slate-500">
                      Priority: {sub.priority}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddTask(sub)}
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
  );
}
