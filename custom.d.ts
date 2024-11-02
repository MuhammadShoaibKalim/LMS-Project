import { Request } from "express";
import {IUser} from "../LMS-Project/server/models/user.model";


declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

