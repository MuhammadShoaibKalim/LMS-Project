
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "./catchAsyncError";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from "../utils/redis";

interface CustomJwtPayload extends JwtPayload {
    id: string;  
}

// export const isAuthenticated = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

//     const access_token = req.cookies.access_token;
//     if (!access_token) {
//         return next(new ErrorHandler('Login first to access this resource.', 401));
//     }

//     const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as CustomJwtPayload;

//     if (!decoded.id) {
//         return next(new ErrorHandler('The token you provided is invalid.', 401));
//     }

//     const user = await redis.get(decoded.id);  
//     if (!user) {
//         return next(new ErrorHandler('User not found.', 404));
//     }

//     // Use Type Assertion to tell TypeScript that req has a user property
//     (req as any).user = JSON.parse(user);
    
//     next();
// });


export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies["access_token"];

    // If no token, proceed to logout without blocking
    if (!token && req.path === "/logout") {
        return next();
    }

    // Normal authentication logic for other routes
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Login first to access this resource."
        });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET as string);
        // req.user = decodedData;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};
