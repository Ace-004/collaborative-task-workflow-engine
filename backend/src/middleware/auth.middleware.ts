import type { Request,Response,NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/verifytoken.js";

export const verifyUser = async(req:Request,res:Response,next:NextFunction)=>{
try {
    const header:string | undefined= req.headers.authorization;
  if(!header)throw new Error("no token");
  if(!header || header.split(" ")[0]!=="Bearer")return res.status(401).json({success:false,message:"unauthorized"});
  const token : string | undefined =header.split(" ")[1];
  if(!token)throw new Error("no token");
  const decoded : string | JwtPayload =verifyToken(token) as {id:number,email?:string};
  // (req as any).user=decoded.userId
  req.user = decoded.id;
  next();
} catch (error) {
  console.error(error);
  res.status(500).json({ success: false, message: "Server Error" });
}

}