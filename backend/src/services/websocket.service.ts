import {Server as HttpServer} from "http";
import { WebSocketServer,WebSocket } from "ws";
import jwt from "jsonwebtoken";


interface AuthenticatedWebSocket extends WebSocket{
  userId?:number;
  isAlive?:boolean;
}

const workspaceRooms = new Map<number,Set<AuthenticatedWebSocket>>();

export const initWebSocketServer = (server:HttpServer)=>{
  const wss = new WebSocketServer({noServer:true});

  server.on("upgrade",(request,socket,head)=>{
    const cookieHeader=request.headers.cookie || "";
    const token = cookieHeader.split("; ").find((row:any)=>row.startsWith("token="))?.split("=")[1];
    if(!token){
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    };
    try {
      const decoded = jwt.verify(token,(process.env.JWT_SECRET_KEY as string)) as {id:number};

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
    ws.on("message",(message:string)=>{
      try {
        const parsed=JSON.parse(message);
        const {type,workspaceId}=parsed;
        if(type==='join-workspace'){
          const wId=Number(workspaceId);
          if(isNaN(wId))return;

          leaveAllRooms(ws);//remove sockets from all previous rooms if any

          if(!workspaceRooms.has(wId)){
            workspaceRooms.set(wId,new Set());
          }
          workspaceRooms.get(wId)!.add(ws);
          console.log(`[WS] User ${ws.userId} joined workspace room: ${wId}`);
        }
      } catch (error) {
        console.error("[WS] Message parsing error:", error);
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
