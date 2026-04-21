import express, { Router } from 'express';
import { registerUserController } from '../controllers/auth.controller.js';

const router:Router=express.Router();

router.post('/register',registerUserController);

export default router;