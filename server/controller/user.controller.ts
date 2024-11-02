import express, { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from 'jsonwebtoken';
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import dotenv from "dotenv";
import { sendToken } from "../utils/jwt";
import {redis} from "../utils/redis";  
dotenv.config();

interface IRegistrationBody {
    name: string;
    email: string;
    password?: string;
    avatar?: string;
}

export const registerationUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email } = req.body;
    const isEmailExist = await userModel.findOne({ email });

    if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
    }

    const user: IRegistrationBody = { name, email };

    const activationToken = createActivationToken(user);

    const activationLink = `${process.env.ORIGIN}/activate?token=${activationToken.token}`;
    const data = { user: { name: user.name }, activationCode: activationToken.activationCode, activationLink };

    const html = await ejs.renderFile(path.join(__dirname, "../mail/activation-mail.ejs"), data);

    try {
        await sendMail({
            email: user.email,
            subject: "Account Activation",
            template: "activation-mail.ejs",
            data,
        });

        res.status(201).json({
            success: true,
            message: "Account registered successfully. Please check your email to activate your account",
            activationToken: activationToken.token,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (!process.env.ACTIVATION_SECRET) {
        throw new Error("ACTIVATION_SECRET is missing or undefined");
    }

    const token = jwt.sign(
        { user: { name: user.name, email: user.email }, activationCode },
        process.env.ACTIVATION_SECRET as string,
        { expiresIn: "10m" }
    );

    return { token, activationCode };
};

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}
export const activateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { activation_code, activation_token } = req.body as IActivationRequest;

    try {
        // Verify the activation token
        const decoded = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as JwtPayload;

        // Check if the activation code matches
        if (decoded.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        // Check if the user already exists in the database
        const existingUser = await userModel.findOne({ email: decoded.user.email });
        if (existingUser) {
            return next(new ErrorHandler("User with this email already activated", 400));
        }

        // Create a new user in the database
        const newUser = new userModel({
            name: decoded.user.name,
            email: decoded.user.email,
            password: req.body.password, // Ensure password is hashed in user model's pre-save hook
            avatar: req.body.avatar || ""
        });

        await newUser.save();

        // Optionally, remove the activation token from Redis or invalidate it here if used

        // Send a token or response to confirm activation success
        sendToken(newUser, 201, res);

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new ErrorHandler("Invalid or expired activation token", 400));
        }
        next(error);
    }
});


interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as ILoginRequest;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
});

export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("access_token", "", {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    res.cookie("refresh_token", "", {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

export const updateAccessToken = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;

    if (!decoded || !decoded.id) {
        return next(new ErrorHandler("Could not refresh the token", 400));
    }

    const session = await redis.get(decoded.id);

    if (!session) {
        return next(new ErrorHandler("Session expired or invalid", 400));
    }

    const user = JSON.parse(session);
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET as string, {
        expiresIn: "5m",
    });

    const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET as string, {
        expiresIn: "3d",
    });

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 1000 // 5 minutes
    });

    res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
    });

    res.status(200).json({
        success: true,
        accessToken,
    });
});
