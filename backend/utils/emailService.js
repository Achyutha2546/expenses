const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Determine configuration - default to environment variables
    let transporterConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };

    // If SMTP_USER is missing, we log it beautifully to the console for testing environments
    const isMock = !process.env.SMTP_USER;
    
    let transporter = nodemailer.createTransport(transporterConfig);

    const mailOptions = {
        from: `Account Recovery <${process.env.SMTP_USER || 'noreply@expense-tracker.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    if (isMock) {
        console.log('====== MOCK EMAIL SERVICE ======');
        console.log(`TO: ${options.email}`);
        console.log(`SUBJECT: ${options.subject}`);
        console.log(`MESSAGE:\n${options.message}`);
        console.log('================================');
        return true; 
    }

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error('Email could not be sent', err);
        return false;
    }
};

module.exports = sendEmail;
