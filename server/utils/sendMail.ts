import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Interface for email options
interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any }; // You can define a more specific type based on your needs
}

// Function to create the transporter for sending emails
const createTransporter = (): Transporter => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // Use environment variable for secure option
        auth: {
            user: process.env.SMTP_EMAIL || process.env.GMAIL_USER,
            pass: process.env.SMTP_PASSWORD || process.env.GMAIL_PASS,
        },
        logger: true, // Log SMTP traffic to console
        debug: true,  // Include debug output in logs
    });

    return transporter;
};

// Function to send email
const sendMail = async (options: EmailOptions): Promise<void> => {
    const transporter: Transporter = createTransporter();

    const { email, subject, template, data } = options;

    // Get the mail template path
    const templatePath = path.join(__dirname, "../mail", template);

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
        console.log("Email sent successfully to:", email); // Log success message
    } catch (error: any) {
        console.error("Error sending email:", error.message); 
        throw new Error("Email sending failed: " + error.message); 
    }
};

export default sendMail;
