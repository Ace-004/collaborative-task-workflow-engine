import { verifyUser } from './../middleware/auth.middleware.js';
import express from 'express';
import { createTask, decomposeTaskWithAI, deleteTask, getAllTask, getTaskById } from '../controllers/task.controller.js';
import { requireWorkspaceRole } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/create',verifyUser,requireWorkspaceRole(["admin","member"]),createTask);
router.get('/',verifyUser,getAllTask);
router.get('/:id',verifyUser,getTaskById);
router.delete('/:id',verifyUser,deleteTask);
router.post('/ai-decompose',verifyUser,decomposeTaskWithAI);

export default router;