// types/express.d.ts

import "express";

declare global {
  namespace Express{
    interface Request {
      user?: number;
    }
  }
}

export {};