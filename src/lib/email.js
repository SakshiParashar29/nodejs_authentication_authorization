const nodemailer = require('nodemailer');

const sendEmail = async(to, subject, html) => {
    if(!process.env.SMTP_HOST || !process.env.SMTP_PASS || !process.env.SMTP_USER){
        console.log("Email envs are not available");
        return;
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || "2525";
    const pass = process.env.SMTP_PASS;
    const user = process.env.SMTP_USER;
    const from = process.env.EMAIL_FROM;

    const transporter = await nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: {
            user,
            pass
        }
    });

    await transporter.sendMail({
        from, to, subject, html
    });

}

module.exports = sendEmail;