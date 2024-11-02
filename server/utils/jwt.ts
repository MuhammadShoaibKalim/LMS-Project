import dotenv from "dotenv";
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

dotenv.config();

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response, options?: ITokenOptions): void => {
    if (!user._id) {
        throw new Error("User ID is required for setting the session in Redis.");
    }

    const accessToken = user.SignAcessToken();
    const refreshToken = user.SignRefreshToken();

    try {
        // Store session in Redis with expiration
        redis.set(user._id.toString(), JSON.stringify(user), 'EX', Number(process.env.REDIS_SESSION_EXPIRE) || 3600);
    } catch (error) {
        console.error("Error setting user session in Redis:", error);
    }

    // Parse expiration times from environment variables
    const accessTokenExpiresInMinutes = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10); 
    const refreshTokenExpiresInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);

    // Set cookie options for access token
    const accessTokenOptions: ITokenOptions = { 
        expires: new Date(Date.now() + accessTokenExpiresInMinutes * 60 * 1000), 
        maxAge: accessTokenExpiresInMinutes * 60 * 1000, 
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    };

    // Set cookie options for refresh token
    const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpiresInDays * 24 * 60 * 60 * 1000),
        maxAge: refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    }; 

    // Set cookies for access and refresh tokens
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    // Send response with tokens and user data
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
        refreshToken,
    });
};
