import { verifyUser } from './../middleware/auth.middleware.js';
import express from 'express';
import { createProject, deleteProject, getAllProjects, getProjectById } from '../controllers/project.controller.js';
import { requireWorkspaceRole } from '../middleware/role.middleware.js';
const router = express.Router();
router.post('/create', verifyUser, requireWorkspaceRole(["admin"]), createProject);
router.get('/', verifyUser, requireWorkspaceRole(["admin", "member"]), getAllProjects);
router.get('/:id', verifyUser, getProjectById);
router.delete('/:id', verifyUser, deleteProject);
export default router;
//# sourceMappingURL=project.route.js.map