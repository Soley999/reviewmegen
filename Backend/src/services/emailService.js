import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter = null;

// Initialize email transporter (configure with your email provider)
function getTransporter() {
  if (!config.email.enabled) {
    return null;
  }

  if (!transporter) {
    // For production, configure with real SMTP settings
    // For development, you can use a service like Mailtrap or Ethereal
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  return transporter;
}

export async function sendWelcomeEmail(user) {
  const transport = getTransporter();
  if (!transport) {
    console.log("Email notifications disabled - would send welcome email to:", user.email);
    return;
  }

  try {
    await transport.sendMail({
      from: config.email.from,
      to: user.email,
      subject: "Welcome to ReviewMeGen!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Welcome to ReviewMeGen! 🎉</h1>
          <p>Hi ${user.name},</p>
          <p>Thank you for registering with ReviewMeGen. You can now:</p>
          <ul>
            <li>Upload documents (PDF, DOCX, TXT) up to 200MB</li>
            <li>Generate AI-powered study reviewers</li>
            <li>Save your reviewers to your dashboard</li>
            <li>Access your study materials anytime</li>
          </ul>
          <p>Start generating your first reviewer today!</p>
          <p style="margin-top: 30px;">
            <a href="${config.clientOrigin}/upload" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            This email was sent because you registered for ReviewMeGen. If you didn't create this account, please ignore this email.
          </p>
        </div>
      `
    });

    console.log("Welcome email sent to:", user.email);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendLoginNotification(user, provider = "email") {
  const transport = getTransporter();
  if (!transport) {
    console.log("Email notifications disabled - would send login notification to:", user.email);
    return;
  }

  try {
    const providerText = provider === "google" ? "Google" : provider === "facebook" ? "Facebook" : "email/password";
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short"
    });

    await transport.sendMail({
      from: config.email.from,
      to: user.email,
      subject: "New Login to Your ReviewMeGen Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">New Login Detected</h1>
          <p>Hi ${user.name},</p>
          <p>A new login to your ReviewMeGen account was detected:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login Method:</strong> ${providerText}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
          </div>
          <p>If this was you, no action is needed. If you didn't log in, please secure your account immediately.</p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            This is an automated security notification from ReviewMeGen.
          </p>
        </div>
      `
    });

    console.log("Login notification sent to:", user.email);
  } catch (error) {
    console.error("Failed to send login notification:", error);
  }
}
