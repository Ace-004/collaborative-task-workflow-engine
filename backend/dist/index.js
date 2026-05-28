import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import projectRoutes from "./routes/project.route.js";
import taskRoutes from "./routes/task.route.js";
import commentRoutes from "./routes/comment.route.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error.middleware.js";
import { createServer } from "http";
import { initWebSocketServer } from "./services/websocket.service.js";
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/workspace", workspaceRoutes);
app.use("/project", projectRoutes);
app.use("/task", taskRoutes);
app.use("/comment", commentRoutes);
app.use(errorHandler);
const server = createServer(app);
initWebSocketServer(server);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map