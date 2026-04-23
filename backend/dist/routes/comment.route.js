import express from 'express';
import { verifyUser } from '../middleware/auth.middleware.js';
import { createComment, deleteComment } from '../controllers/comment.controller.js';
const router = express.Router();
router.post('/create', verifyUser, createComment);
router.delete('/:id', verifyUser, deleteComment);
export default router;
//# sourceMappingURL=comment.route.js.map