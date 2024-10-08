import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config();
export const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.get("/", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the API",
    });
});
