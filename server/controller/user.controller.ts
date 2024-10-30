import express, { Request, Response, NextFunction } from "express";

import userModel, { IUser } from "../models/user.model";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import dotenv from "dotenv";
import { sendToken } from "../utils/jwt";
dotenv.config();

interface IRegistrationBody {
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    
}
export const registerationUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email } = req.body; // Removed password from here
        const isEmailExist = await userModel.findOne({ email });

        if (isEmailExist) {
            return next(new ErrorHandler("Email is already exist", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
        };

        // Create activation token
        const activationToken = createActivationToken(user);

        // Create the activation link
        const activationLink = `${process.env.ORIGIN}/activate?token=${activationToken.token}`;

        // Prepare the email data including activation link
        const data = {
            user: { name: user.name },
            activationCode: activationToken.activationCode,
            activationLink,
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
    console.log("ACTIVATION_SECRET:", process.env.ACTIVATION_SECRET); 
    
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

// Activate user 
interface IActivationRequest{
    activation_token:string,
    activation_code:string,

}
export const activateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_code, activation_token } = req.body as IActivationRequest;

        // Verify the activation token
        const newUser = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser; activationCode: string };

        // Check if the activation code matches
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        const { name, email } = newUser.user; // Omit password and avatar here
        const existUser = await userModel.findOne({ email });

        if (existUser) {
            return next(new ErrorHandler("Email already exists.", 400));
        }

        // Create new user in the database without password and avatar
        const user = await userModel.create({
            name,
            email,
            // No password or avatar fields included
        });

        res.status(201).json({
            success: true,
            message: "User activated successfully.",
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//Login user
interface ILoginRequest {
    email:string;
    password:string;
}


export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {
       const { email, password } = req.body as ILoginRequest;
       
       if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }
      
    sendToken(user, 200, res);


   } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
   }
});


// export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => { 
//      try {
//           res.cookie("access token success", " ", {maxAge:1});
//           res.cookie("refresh token success", " ", {maxAge:1});
//             res.status(200).json({
//                 success:true,
//                 message:"Logged out successfully"});
//      } catch (error:any) {
//         return next(new ErrorHandler(error.message, 400));
//        }
// });


export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => { 
    try {
        // Clear access token cookie
        res.cookie("access_token", "", { 
            httpOnly: true,
            expires: new Date(0),  // Expire immediately
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'  // Secure flag for production
        });

        // Clear refresh token cookie
        res.cookie("refresh_token", "", { 
            httpOnly: true,
            expires: new Date(0),  // Expire immediately
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'  // Secure flag for production
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
