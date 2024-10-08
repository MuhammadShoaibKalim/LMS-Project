import mongoose from 'mongoose';
import dotenv from "dotenv";

dotenv.config();

const dbURL = process.env.MONGODB_URI  || ' ';

const connectDB = async () => {
    try {
        await mongoose.connect(dbURL, {
        // useUnifiedTopology: true,
        // useNewUrlParser: true,
        });
        console.log("MongoDB Connection Success");
    } catch (error) {
        console.error("MongoDB Connection Failed");
        process.exit(1);
    }
}

export default connectDB;