import {pool} from '../db/pool.js';
import type { Request,Response } from 'express';
import bcrypt from 'bcryptjs';
import { createUserQuery } from '../db/queries/user.query.js';

export const registerUserController=async(req : Request,res : Response)=>{
  const {email,password}=req.body;  
  const password_hash=await bcrypt.hash(password,12);
  const user = await createUserQuery(email,password_hash);
  res.status(201).json({success:true,data:user});
}