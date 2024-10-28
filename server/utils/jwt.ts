import dotenv from "dotenv";
import { Response } from "express";
import { IUser } from "../models/user.model";
import {redis} from "./redis"; 

dotenv.config();

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response, options?: ITokenOptions) => {
    const accessToken = user.SignAcessToken();
    const refreshToken = user.SignRefreshToken();

    //upload session to redis 
    redis.set(user._id, JSON.stringify(user) as any);

 
    // Parse environment variables
    const accessTokenExpires = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10); 
    const refreshTokenExpires = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10); 

    // Set cookie options for access token
    const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpires * 1000),
        maxAge: accessTokenExpires * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production', 
    };

    // Set cookie options for refresh token
    const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpires * 1000),
        maxAge: refreshTokenExpires * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production', 
    };

    // Set the cookies for accessToken and refreshToken
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    // Send response with tokens and user info
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
        refreshToken,
    });

};
