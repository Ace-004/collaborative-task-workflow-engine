import { createProjectQuery, deleteProjectQuery, getAllProjectsQuery, getProjectByIdQuery } from "../db/queries/project.query.js";
export const createProject = async (req, res) => {
    const { name, workspace_id } = req.body;
    const owner = req.user;
    try {
        if (typeof owner === "number") {
            const project = await createProjectQuery(name, workspace_id, owner);
            if (!project)
                return res.status(403).json({ success: false, message: "Unauthorized or workspace not found" });
            res.status(201).json({ success: true, data: project });
        }
    }
    catch (error) {
        console.error('error occurred', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const getAllProjects = async (req, res) => {
    const { workspace_id } = req.query;
    try {
        const projects = await getAllProjectsQuery(Number(workspace_id));
        res.status(200).json({ success: true, data: projects });
    }
    catch (error) {
        console.error('error occurred', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const getProjectById = async (req, res) => {
    const id = req.params.id;
    try {
        const project = await getProjectByIdQuery(id);
        res.status(200).json({ success: true, data: project });
    }
    catch (error) {
        console.error('error occured', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const deleteProject = async (req, res) => {
    const id = req.params.id;
    const owner = req.user;
    try {
        if (typeof owner === "number" && typeof id === "string") {
            const project = await deleteProjectQuery(id, owner);
            if (!project)
                return res.status(403).json({ success: false, message: "Unauthorized or project not found" });
            res.status(200).json({ success: true, message: "project deleted successfully" });
        }
    }
    catch (error) {
        console.error('error occured', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
//# sourceMappingURL=project.controller.js.map