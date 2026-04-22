// types/express.d.ts

import "express";

declare global {
  namespace Express{
    interface Request {
      user?: {
        userId:number;
        email?:string;
      }
    }
  }
}

export {};