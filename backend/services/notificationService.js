const nodemailer = require('nodemailer');
const { Notification } = require('../models/index');

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Email templates ───────────────────────────────────────────────────────────
const emailTemplates = {
  welcome: (data) => ({
    subject: '🏠 Welcome to MulundStays!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">MulundStays</h1>
          <p style="color: #aaa; margin: 5px 0;">Your home away from home in Mulund</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Welcome, ${data.name}! 🎉</h2>
          <p>Thank you for joining MulundStays. We're excited to help you find the perfect stay in Mulund.</p>
          <p>Start exploring cozy rooms, entire flats, and more — right near Mulund station.</p>
          <a href="${process.env.CLIENT_URL}/search" style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">
            Explore Listings
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MulundStays. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  bookingConfirmed: (data) => ({
    subject: `✅ Booking Confirmed — ${data.bookingRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">MulundStays</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Your booking is confirmed! ✅</h2>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0;">
            <p><strong>Booking Ref:</strong> ${data.bookingRef}</p>
            <p><strong>Property:</strong> ${data.listingTitle}</p>
            <p><strong>Check-in:</strong> ${data.checkIn}</p>
            <p><strong>Check-out:</strong> ${data.checkOut}</p>
            <p><strong>Total Paid:</strong> ₹${data.totalAmount?.toLocaleString('en-IN')}</p>
          </div>
          <p>You'll receive the full address 24 hours before check-in.</p>
          <a href="${process.env.CLIENT_URL}/bookings/${data.bookingId}" style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">
            View Booking
          </a>
        </div>
      </div>
    `,
  }),

  resetPassword: (data) => ({
    subject: 'MulundStays — Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">MulundStays</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Password Reset Request</h2>
          <p>Hi ${data.name}, we received a request to reset your password.</p>
          <a href="${data.resetUrl}" style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  }),
};

// ── Send Email ─────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    let emailHtml = html;
    let emailSubject = subject;

    if (template && emailTemplates[template]) {
      const compiled = emailTemplates[template](data || {});
      emailHtml = compiled.html;
      emailSubject = compiled.subject;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: emailSubject,
      html: emailHtml,
    });

    console.log(`📧 Email sent to ${to}: ${emailSubject}`);
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failures shouldn't break the main flow
  }
};

// ── Send SMS via MSG91 ────────────────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  try {
    if (!process.env.MSG91_API_KEY) {
      console.log(`📱 SMS [mock] to ${phone}: ${message}`);
      return;
    }

    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': process.env.MSG91_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: process.env.MSG91_TEMPLATE_ID,
        sender: process.env.MSG91_SENDER_ID,
        mobiles: `91${phone}`,
        VAR1: message,
      }),
    });

    const result = await response.json();
    console.log(`📱 SMS sent to ${phone}:`, result);
  } catch (err) {
    console.error('SMS send error:', err.message);
  }
};

// ── Send OTP via SMS ──────────────────────────────────────────────────────────
const sendOTP = async (phone, otp, name) => {
  const message = `Hi ${name}, your MulundStays OTP is ${otp}. Valid for 10 minutes. Do not share this with anyone.`;
  await sendSMS(phone, message);
};

// ── Save in-app notification + trigger SMS/email ───────────────────────────────
const sendNotification = async ({ userId, type, title, message, data = {}, channels = {} }) => {
  try {
    // Save to DB
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      channels: {
        inApp: channels.inApp !== false,
        email: !!channels.email,
        sms: !!channels.sms,
      },
    });

    // Trigger SMS if requested
    if (channels.sms) {
      const User = require('../models/User');
      const user = await User.findById(userId).select('phone notifications');
      if (user?.phone && user.notifications?.sms !== false) {
        await sendSMS(user.phone, `MulundStays: ${message}`);
      }
    }

    // Trigger email if requested
    if (channels.email) {
      const User = require('../models/User');
      const user = await User.findById(userId).select('email fullName notifications');
      if (user?.email && user.notifications?.email !== false) {
        await sendEmail({
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${title}</h2>
              <p>${message}</p>
              <a href="${process.env.CLIENT_URL}" style="color: #e94560;">Open MulundStays</a>
            </div>
          `,
        });
      }
    }

    return notification;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// ── Get user notifications ────────────────────────────────────────────────────
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const { Notification } = require('../models/index');
  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();
};

module.exports = { sendEmail, sendSMS, sendOTP, sendNotification, getUserNotifications };
