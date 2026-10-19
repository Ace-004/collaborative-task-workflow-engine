import {Server as HttpServer} from "http";
import { WebSocketServer,WebSocket } from "ws";
import { verifyToken } from "../utils/verifytoken.js";
import { pool } from "../db/pool.js";


interface AuthenticatedWebSocket extends WebSocket{
  userId?:number;
  isAlive?:boolean;
}

const workspaceRooms = new Map<number,Set<AuthenticatedWebSocket>>();

export const initWebSocketServer = (server:HttpServer)=>{
  const wss = new WebSocketServer({noServer:true, maxPayload: 16 * 1024});

  server.on("upgrade",(request,socket,head)=>{
    const cookieHeader=request.headers.cookie || "";
    const token = cookieHeader.split("; ").find((row:any)=>row.startsWith("token="))?.split("=")[1];
    if(!token){
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    };
    try {
      const decoded = verifyToken(token) as {id:number};

      wss.handleUpgrade(request,socket,head,(ws)=>{
        const AuthenticatedWs=ws as AuthenticatedWebSocket;
        AuthenticatedWs.userId=decoded.id;
        AuthenticatedWs.isAlive=true;
        wss.emit("connection",AuthenticatedWs,request);
      });
    } catch (error) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    };
  });

  wss.on("connection",(ws: AuthenticatedWebSocket)=>{
    console.log(`[WS] User ${ws.userId} connected.`);
    ws.on("pong",()=>{
      ws.isAlive=true;
    });
    ws.on("message",async (message)=>{
      try {
        const parsed=JSON.parse(message.toString());
        const {type,workspaceId}=parsed;
        if(type==='join-workspace'){
          const wId=Number(workspaceId);
          if(!Number.isInteger(wId))return;

          // Only workspace members may subscribe to a workspace's events.
          const { rows } = await pool.query(
            "SELECT 1 FROM workspace_members WHERE user_id=$1 AND workspace_id=$2",
            [ws.userId, wId],
          );
          if(rows.length===0){
            ws.send(JSON.stringify({event:"error",data:{message:"not a member of this workspace"}}));
            return;
          }
          if(ws.readyState!==WebSocket.OPEN)return; // closed while we were checking

          leaveAllRooms(ws);//remove sockets from all previous rooms if any

          if(!workspaceRooms.has(wId)){
            workspaceRooms.set(wId,new Set());
          }
          workspaceRooms.get(wId)!.add(ws);
          console.log(`[WS] User ${ws.userId} joined workspace room: ${wId}`);
        }
      } catch (error) {
        console.error("[WS] Message handling error:", error);
      };
    });

    ws.on("close",()=>{
      console.log(`[WS] User ${ws.userId} disconnected.`);
      leaveAllRooms(ws);
    });

    ws.on("error", (err) => {
      console.error(`[WS] Error on user socket ${ws.userId}:`, err);
      leaveAllRooms(ws);
    });

  });

  // Heartbeat ping interval to clean up stale connections every 30 seconds
  const interval = setInterval(()=>{
    wss.clients.forEach((ws:AuthenticatedWebSocket)=>{
      if(ws.isAlive===false){
        console.log(`[WS] Terminating inactive connection for User ${ws.userId}`);
        leaveAllRooms(ws);
        return ws.terminate();
      }
      ws.isAlive=false;
      ws.ping();
    })
  },30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

};

// Remove a socket from all workspace sets
const leaveAllRooms=(ws:AuthenticatedWebSocket)=>{
  workspaceRooms.forEach((clients,workspaceId)=>{
    if(clients.has(ws)){
      clients.delete(ws);
      console.log(`[WS] User ${ws.userId} left workspace room: ${workspaceId}`);
      if (clients.size === 0) {
        workspaceRooms.delete(workspaceId);
      };
    }
  });
}

/**
 * Broadcast an event to all users in a specific workspace
 */
export const broadcastToWorkspace = (workspaceId: number, event: string, payload: any) => {
  const clients = workspaceRooms.get(workspaceId);
  if (!clients) return;
  const dataStr = JSON.stringify({ event, data: payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(dataStr);
    }
  });
};
