import express from "express";

import {registerationUser, activateUser, loginUser} from "../controller/user.controller";
const userRouter = express.Router();
userRouter.post("/registeration", registerationUser);

userRouter.post("/activate-user", activateUser);
userRouter.post("/login-user", loginUser);



export default userRouter;