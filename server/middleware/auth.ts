
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

    if (!token && req.path === "/logout") {
        return next();
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Login first to access this resource."
        });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
        
        // Use type assertion to tell TypeScript that req has a user property
        (req as any).user = decodedData; 

        const userId = decodedData.id || '';
        redis.del(userId);

        // Continue with Redis or other logic 

          

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};


export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes((req as any).user?.role || '')) {
            return next(
                new ErrorHandler(
                    `Role (${(req as any).user?.role}) is not allowed to access this resource.`, 403
                )
            );
        }
        next();
    };
}