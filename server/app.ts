import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
export const app =express();
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();
app.use(express.json({limit:"50mb"}));

app.use(cookieParser());

app.use(cors({origin: process.env.ORIGIN, credentials: true}));

app.get("/", (req:Request, res:Response, next:NextFunction) => {
    res.status(200)
    .json({
        success:true,
        message:"Welcome to the API",
    })
});     



app.all("*", (req:Request, res:Response, next:NextFunction) => {
    const err= new Error("Page Not Found");
    // err.statusCode = 404;
    next(err);

});    