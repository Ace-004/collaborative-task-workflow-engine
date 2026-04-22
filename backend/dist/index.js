import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/workspace", workspaceRoutes);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`server running on port${PORT}`);
});
//# sourceMappingURL=index.js.map