import { createWorkspaceService, deleteWorkspaceService, getAllWorkspaceService, getWorkspaceByIdService } from "../services/workspace.service.js";
export const createWorkspace = async (req, res) => {
    const { name } = req.body;
    const owner_id = req.user;
    try {
        if (!owner_id)
            throw new Error("no user id");
        if (typeof owner_id === "number") {
            const workspace = createWorkspaceService(name, owner_id);
            res.status(201).json({ success: true, data: workspace });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: "server error" + error });
    }
};
export const getAllWorkspace = async (req, res) => {
    const userId = req.user;
    try {
        if (!userId)
            throw new Error("no user ID");
        if (typeof userId === "number") {
            const workspace = await getAllWorkspaceService(userId);
            res.status(200).json({ success: true, data: workspace });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "server errror" });
    }
};
export const getWorkspaceById = async (req, res) => {
    const id = req.params.id;
    try {
        if (typeof id === "string") {
            const workspace = await getWorkspaceByIdService(id);
            res.status(200).json({ success: true, data: workspace });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: "server error" });
    }
};
export const deleteWorkspace = async (req, res) => {
    const id = req.params.id;
    try {
        if (typeof id === "string") {
            const workspace = await deleteWorkspaceService(id);
            res.status(200).json({ success: true, message: "workspace deleted successfully" });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: "server error" });
    }
};
//# sourceMappingURL=workspace.controller.js.map