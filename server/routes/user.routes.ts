import express from "express";

import {registerationUser, activateUser, loginUser} from "../controller/user.controller";
const userRouter = express.Router();
userRouter.post("/registration", registerationUser);

userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);



export default userRouter; 