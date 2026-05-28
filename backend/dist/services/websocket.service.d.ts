import { Server as HttpServer } from "http";
export declare const initWebSocketServer: (server: HttpServer) => void;
/**
 * Broadcast an event to all users in a specific workspace
 */
export declare const broadcastToWorkspace: (workspaceId: number, event: string, payload: any) => void;
//# sourceMappingURL=websocket.service.d.ts.map