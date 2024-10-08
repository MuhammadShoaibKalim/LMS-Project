import { Request, Response, NextFunction } from "express";
import errorHandler from "../utils/ErrorHandler";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Set default values for status code and message
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Handle specific error cases
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new errorHandler(message, 400);
    }

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new errorHandler(message, 400);
    }

    if (err.name === "JsonWebTokenError") {
        const message = "Your token is invalid. Please try again.";
        err = new errorHandler(message, 400);
    }

    if (err.name === "TokenExpiredError") {
        const message = "Your token has expired. Please try again.";
        err = new errorHandler(message, 400);
    }

    // Send the error response to the client
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
