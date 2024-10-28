import express from "express";

import {registerationUser, activateUser, loginUser, logoutUser} from "../controller/user.controller";
const userRouter = express.Router();
userRouter.post("/registration", registerationUser);

userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);




export default userRouter; 