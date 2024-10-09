import express, { Request, Response, NextFunction } from "express";

export const catchAsyncError = (Func: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(Func(req, res, next)).catch(next);
  };
};
