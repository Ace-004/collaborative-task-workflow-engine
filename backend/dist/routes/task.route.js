import { verifyUser } from './../middleware/auth.middleware.js';
import express from 'express';
import { createTask, deleteTask, getAllTask, getTaskById } from '../controllers/task.controller.js';
const router = express.Router();
router.post('/create', verifyUser, createTask);
router.get('/', verifyUser, getAllTask);
router.get('/:id', verifyUser, getTaskById);
router.delete('/:id', verifyUser, deleteTask);
export default router;
//# sourceMappingURL=task.route.js.map