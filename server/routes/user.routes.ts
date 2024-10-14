import express from "express";

import {registerationUser} from "../controller/user.controller";
const userRouter = express.Router();
userRouter.post("/register", registerationUser);

export default userRouter;