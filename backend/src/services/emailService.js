const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendPasswordReset = async (email, name, resetUrl) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"PathPilot" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your PathPilot Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🚀 PathPilot</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <h2>Hi ${name},</h2>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">Reset Password</a>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

const sendWelcome = async (email, name) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"PathPilot" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to PathPilot! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🚀 PathPilot</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Welcome aboard, ${name}! 🎉</h2>
          <p>Your learning journey starts now. PathPilot will help you go from beginner to job-ready with:</p>
          <ul>
            <li>🗺️ AI-generated personalized roadmaps</li>
            <li>📹 Distraction-free video learning</li>
            <li>🤖 24/7 AI Tutor support</li>
            <li>🎮 Gamified progress tracking</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Start Learning →</a>
        </div>
      </div>
    `,
  });
};

module.exports = { sendPasswordReset, sendWelcome };
