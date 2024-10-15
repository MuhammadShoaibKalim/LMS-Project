import { app } from "./app"; 
import connectDB from "./utils/db"; 
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB(); 
});
