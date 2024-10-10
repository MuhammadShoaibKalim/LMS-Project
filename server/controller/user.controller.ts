import express, {Request, Response, NextFunction} from "express";
import userModel, {IUser} from "../models/user.model";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler  from "../utils/ErrorHandler";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?:string;
}

export const registerUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
      try {
          const {name, email, password} = req.body;
 
    const isEmailExist  = await userModel.findOne({email});
      if(isEmailExist){
        return next(new ErrorHandler("Email is already exist", 400));
      }

      const user : IRegistrationBody = {
         name,
         email,
         password
      };

      const activationToken = createActivationToken(user);


      } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
      }
    });

    interface IActivationToken {
         token :string,
         activationCode: string;
    }

    export const createActivationToken  = (user:IUser) : IActivationToken =>{

      const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const token = jwt.sign({user, activationCode}, 
        process.env.ACTIVATION_SECRETE, {
        expiresIn: "10m"
      });


      return { token, activationCode};
    }

    