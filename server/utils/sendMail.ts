import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';  
import dotenv from "dotenv";

dotenv.config();

// Interface for email options
interface EmailOptions {
    email: string;
    subject: string;
    template: string; 
    data: { [key: string]: any }; 
}

// Function to create the transporter for sending emails
const createTransporter = (): Transporter => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
            user: process.env.SMTP_EMAIL || process.env.GMAIL_USER,
            pass: process.env.SMTP_PASSWORD || process.env.GMAIL_PASS,
        },
        logger: true, 
        debug: true, 
    });
};

// Function to send email
const sendMail = async (options: EmailOptions): Promise<void> => {
    const transporter: Transporter = createTransporter();

    const { email, subject, template, data } = options;

    // Use __dirname to resolve the template path
    const templatePath = path.resolve(__dirname, "../mail", `${template}`);
    console.log("Template Path:", templatePath);    
    console.log("__dirname:", __dirname);
    console.log("Checking for template file...");
    
    // Check if template file exists
    const templateExists = fs.existsSync(templatePath);
    console.log("Template exists:", templateExists);

  
 

    
    if (!templateExists) {
        console.error("Template file not found. Please check the file name and path.");
        throw new Error("Template file does not exist at the path: " + templatePath);
    }

    try {
        // Render the email template with ejs
        const html: string = await ejs.renderFile(templatePath, data); 

        const mailOptions = {
            from: process.env.SMTP_MAIL || process.env.GMAIL_USER, 
            to: email,
            subject,
            html,
        }; 

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", email); 
    } catch (error: any) {
        console.error("Error sending email:", error.message); 
        throw new Error("Email sending failed: " + error.message); 
    }
};

export default sendMail;
