import { error } from "console";
import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();


const redisClient = ( ) =>{
    if(process.env.REDIUS_URL ){
        console.log("Redis is connected.");
        return process.env.REDIUS_URL;
    }
    else{
        throw new Error("Redis is not connected.");
    }
}

export const redis= new Redis(redisClient());
