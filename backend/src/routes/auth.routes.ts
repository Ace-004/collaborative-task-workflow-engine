import express, { Router } from 'express';
import { loginUserController, registerUserController } from '../controllers/auth.controller.js';

const router:Router=express.Router();

router.post('/register',registerUserController);
router.post('/login',loginUserController);

export default router;