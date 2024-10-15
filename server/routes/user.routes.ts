import express from "express";

import {registerationUser} from "../controller/user.controller";
const userRouter = express.Router();
userRouter.post("/registeration", registerationUser);

export default userRouter;