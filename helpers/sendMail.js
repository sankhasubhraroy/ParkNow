const nodemailer = require('nodemailer');

const sendMail = async (email, subject, content) => {

    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD
            },
        });

        const options = {
            from: '"ParkNow"<process.env.SMTP_MAIL>',
            to: email,
            subject: subject,
            html: content
        }

        transporter.sendMail(options, (err, info) => {
            if (err) {
                console.log(err);
                return false;
            }
            else {
                // console.log("Message sent: %s", info.messageId);
                return true;
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = sendMail;