import express, { Router } from 'express';
import { createWorkspace, deleteWorkspace, getAllWorkspace, getWorkspaceById } from '../controllers/workspace.controller.js';
import { verifyUser } from '../middleware/auth.middleware.js';
const router = express.Router();
router.post('/create', verifyUser, createWorkspace);
router.get('/', verifyUser, getAllWorkspace);
router.get('/:id', verifyUser, getWorkspaceById);
router.delete('/:id', verifyUser, deleteWorkspace);
export default router;
//# sourceMappingURL=workspace.routes.js.map