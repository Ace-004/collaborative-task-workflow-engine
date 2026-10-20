import express, { Router } from 'express';
import { loginUserController, logoutUserController, registerUserController } from '../controllers/auth.controller.js';

const router:Router=express.Router();

router.post('/register',registerUserController);
router.post('/login',loginUserController);
router.post('/logout',logoutUserController);

export default router;