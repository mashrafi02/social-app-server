const nodemailer = require('nodemailer');

const sendResetEmail = async (mailOptions) => {

    const transport = nodemailer.createTransport({
        service: "gmail",  
        auth: {
          user: process.env.GMAIL_USER, 
          pass: process.env.GMAIL_PASS 
        }
    });

    const emailOptions = {
        from: process.env.GMAIL_USER,
        to: mailOptions.email,
        subject: mailOptions.subject,
        html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #f9fafb; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"><h2 style="color: #2C3E50; margin-bottom: 10px;">Hey ${mailOptions.userName}, 👋</h2><p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;"> We received a request from you — ${mailOptions.message}. To continue, here is the token below </p><a style="display: inline-block; background: #007BFF; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; transition: background 0.3s;">${mailOptions.resetPassToken}</a><p style="font-size: 13px; color: #888; margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;"> Didn’t make this request? No worries — just ignore this email. <br><br> Have a great day! <br><strong>The Social Team</strong></p></div>`
    }

    try {
        await transport.sendMail(emailOptions)
    } catch (err) {
        console.error(err)
    }
    
}

module.exports = sendResetEmail;