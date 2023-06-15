const nodemailer = require("nodemailer");

exports.generateOTP = (otp_lenght = 6) => {
  //create OTP
  let OTP = "";
  for (let i = 1; i <= otp_lenght; i++) {
    const ramdomVal = Math.round(Math.random() * 9);
    OTP += ramdomVal;
  }
  return OTP;
};

exports.generateMailTransporter = () =>
  nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAIL_TRAP_USER,
      pass: process.env.MAIL_TRAP_PASSWORD,
    },
  });
