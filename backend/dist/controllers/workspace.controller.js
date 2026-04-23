import { createWorkspaceService, deleteWorkspaceService, getAllWorkspaceService, getWorkspaceByIdService } from "../services/workspace.service.js";
export const createWorkspace = async (req, res) => {
    const { name } = req.body;
    const owner_id = req.user;
    try {
        if (typeof owner_id !== "number")
            throw new Error("no user id");
        const workspace = await createWorkspaceService(name, owner_id);
        res.status(201).json({ success: true, data: workspace });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const getAllWorkspace = async (req, res) => {
    const userId = req.user;
    try {
        if (typeof userId !== "number")
            throw new Error("no user ID");
        const workspace = await getAllWorkspaceService(userId);
        res.status(200).json({ success: true, data: workspace });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const getWorkspaceById = async (req, res) => {
    const id = req.params.id;
    const user_id = req.user;
    try {
        if (typeof id === "string" && typeof user_id === "number") {
            const workspace = await getWorkspaceByIdService(id, user_id);
            res.status(200).json({ success: true, data: workspace });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const deleteWorkspace = async (req, res) => {
    const id = req.params.id;
    const owner_id = req.user;
    try {
        if (typeof id === "string" && typeof owner_id === "number") {
            const workspace = await deleteWorkspaceService(id, owner_id);
            res.status(200).json({ success: true, message: "workspace deleted successfully" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
//# sourceMappingURL=workspace.controller.js.map