import mongoose, {Document, Model, Schema} from  "mongoose";
import bcrypt from "bcrypt";

const EmailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface IUser extends Document{
     name:string;
     email:string;
     password: string;
     avatar: {
            public_id:string;
            url:string;
     },
     role:string;
     isVerified:boolean;
     courses: Array<{courseId:string}> ;
     comparePassword:(password:string)=>Promise<boolean>;
     
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        maxLength: [30, "Your name cannot exceed 30 characters"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        match: [EmailRegexPattern, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minlength: [6, "Your password must be longer than 6 characters"],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course"
            }
        }
    ]
}, { timestamps: true });


//Hash Password 
userSchema.pre<IUser>("save", async function(next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});



//Compare user password
userSchema.methods.comparePassword = async function(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};



//export 
const userModel = mongoose.model<IUser>("User", userSchema);
export default userModel;
