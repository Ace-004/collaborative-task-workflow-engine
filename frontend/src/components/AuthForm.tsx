import React, { useState } from "react";
import type { User } from "../types";
import { apiPost } from "../api";

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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
      const json = await apiPost<User>(endpoint, { email: authEmail, password: authPassword });
      if (json.success && json.data) {
        const loggedUser: User = { id: json.data.id, email: json.data.email || authEmail };
        onAuthSuccess(loggedUser);
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
                {authLoading ? "Processing..." : isRegister ? "Sign Up" : "Sign In"}
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
