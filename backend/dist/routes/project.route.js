import { verifyUser } from './../middleware/auth.middleware.js';
import express from 'express';
import { createProject, deleteProject, getAllProjects, getProjectById } from '../controllers/project.controller.js';
const router = express.Router();
router.post('/create', verifyUser, createProject);
router.get('/', verifyUser, getAllProjects);
router.get('/:id', verifyUser, getProjectById);
router.delete('/:id', verifyUser, deleteProject);
export default router;
//# sourceMappingURL=project.route.js.map