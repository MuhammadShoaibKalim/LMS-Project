import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {errorMiddleware} from './middleware/errors';
import userRouter from './routes/user.routes';


import dotenv from 'dotenv';
dotenv.config();

 
export const app = express();
 
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));

app.use("/api/v1", userRouter);

// activate-user

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the API",
    });
});

  

// app.all("*", (req: Request, res: Response, next: NextFunction) => {
//    const err= new Error(`Can't find ${req.originalUrl} on this server`);
//     res.status(404);
//     next(err);

// }); 
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server`);
    res.status(404);
    next(err);
});


app.use(errorMiddleware);