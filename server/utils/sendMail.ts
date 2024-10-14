import nodemailer, { Transporter } from 'nodemailer';
import  ejs from 'ejs';
import path from 'path';
import dotenv from "dotenv";
dotenv.config();

interface EmailOptions{
    email: string;
    subject: string;
    template: string;
    data:{[key:string]:any};

}

const  sendMail = async (options: EmailOptions) :Promise <void> =>{
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ||  '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });
    const {email,subject, template, data} = options;

    //get the mail to email template 
    const templatePath= path.join(__dirname, "../mail", template);

    //render the email template with ejs
    const html:string = await ejs.renderFile(templatePath, data);

    const mailOptions ={
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    }

   await transporter.sendMail(mailOptions); 
}


export default sendMail;