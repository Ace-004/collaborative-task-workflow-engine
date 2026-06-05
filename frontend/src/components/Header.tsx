
interface HeaderProps {
  userEmail: string;
  wsConnected: boolean;
  onLogout: () => void;
}

export default function Header({ userEmail, wsConnected, onLogout }: HeaderProps) {
  return (
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

        <span className="text-sm text-slate-300 hidden sm:inline">{userEmail}</span>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
