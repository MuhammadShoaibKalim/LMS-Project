import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const EmailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    avatar?: {
        public_id?: string;
        url?: string;
    };
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>;
    signAccessToken: () => string;
    signRefreshToken: () => string;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
            maxLength: [30, "Your name cannot exceed 30 characters"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            unique: true,
            match: [EmailRegexPattern, "Please enter a valid email address"],
        },
        password: {
            type: String,
            required: false,
            minlength: [6, "Your password must be longer than 6 characters"],
            select: false,
        },
        avatar: {
            public_id: {
                type: String,
                required: false,
            },
            url: {
                type: String,
                required: false,
            },
        },
        role: {
            type: String,
            default: "user",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        courses: [
            {
                courseId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Course",
                },
            },
        ],
    },
    { timestamps: true }
);

// Pre-save hook to hash the password if it's modified or newly created
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next(); // Skip hashing if password is not modified or not present
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to sign an access token
userSchema.methods.signAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET || "defaultAccessTokenSecret", {
        expiresIn: "5m",
    });
};

// Method to sign a refresh token
userSchema.methods.signRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET || "defaultRefreshTokenSecret", {
        expiresIn: "3d",
    });
};

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword: string) {
    if (!this.password) throw new Error("Password is not available for comparison");
    return bcrypt.compare(enteredPassword, this.password);
};

// Export the model
const userModel = mongoose.model<IUser>("User", userSchema);

export default userModel;
