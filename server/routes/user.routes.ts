import express from "express";

import {registerationUser, activateUser} from "../controller/user.controller";
const userRouter = express.Router();
userRouter.post("/registeration", registerationUser);

userRouter.post("/activate-user", activateUser);


export default userRouter;