import express, { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import dotenv from "dotenv";

dotenv.config();

interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerationUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await userModel.findOne({ email });

        if (isEmailExist) {
            return next(new ErrorHandler("Email is already exist", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
            password,
        };

        // Create activation token
        const activationToken = createActivationToken(user);
        
        // Create the activation link
        const activationLink = `${process.env.ORIGIN}/activate?token=${activationToken.token}`;

        // Prepare the email data including activation link
        const data = { 
            user: { name: user.name }, 
            activationCode: activationToken.activationCode, 
            activationLink 
        };

        // Render the email template with the activation link
        const html = await ejs.renderFile(path.join(__dirname, "../mail/activation-mail.ejs"), data);

        try {
            // Send the activation email
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
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    // console.log("ACTIVATION_SECRET:", process.env.ACTIVATION_SECRET); 
    
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
}
