import nodemailer from 'nodemailer';

const SMTP_EMAIL = "khanumer20012001@gmail.com";
const SMTP_PASSWORD = "gqxnuweprbxowlrv";

async function test() {
  console.log("Testing with email:", SMTP_EMAIL);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: SMTP_EMAIL,
      to: "khanumer200121@gmail.com",
      subject: "Test Email",
      text: "This is a test email"
    });
    console.log("SUCCESS!");
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
