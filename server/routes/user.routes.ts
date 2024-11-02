import express from "express";

import {registerationUser, activateUser, loginUser, logoutUser, updateAccessToken} from "../controller/user.controller";
import { isAuthenticated } from "../middleware/auth";
const userRouter = express.Router();
userRouter.post("/registration", registerationUser);

userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);

userRouter.get("/refreshtoken", updateAccessToken);





export default userRouter; 