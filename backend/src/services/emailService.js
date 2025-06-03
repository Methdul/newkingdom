/**
 * Email Service
 * Handles all email communications
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = process.env.ENABLE_EMAIL === 'true';
    this.isMockMode = process.env.MOCK_EMAIL === 'true' || process.env.NODE_ENV === 'test';
    
    if (this.isEnabled && !this.isMockMode) {
      this.initializeTransporter();
    }
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service initialization failed:', error);
        } else {
          logger.info('✅ Email service initialized successfully');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send email (with mock mode support)
   */
  async sendEmail(options) {
    const {
      to,
      subject,
      text,
      html,
      template,
      context = {}
    } = options;

    // Mock mode - just log the email
    if (this.isMockMode) {
      logger.info('📧 Mock Email Sent:', {
        to,
        subject,
        template,
        context: Object.keys(context)
      });
      return { messageId: 'mock-' + Date.now() };
    }

    // Email disabled
    if (!this.isEnabled) {
      logger.debug('Email sending is disabled');
      return null;
    }

    // No transporter available
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      throw new Error('Email service unavailable');
    }

    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'FitZone Pro'} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        text,
        html: html || (template ? this.renderTemplate(template, context) : text)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('📧 Email sent successfully:', {
        to,
        subject,
        messageId: result.messageId
      });

      return result;

    } catch (error) {
      logger.error('Failed to send email:', {
        to,
        subject,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Render email template
   */
  renderTemplate(template, context) {
    const templates = {
      welcome: this.welcomeTemplate,
      passwordReset: this.passwordResetTemplate,
      membershipExpiry: this.membershipExpiryTemplate,
      paymentConfirmation: this.paymentConfirmationTemplate,
      membershipRenewal: this.membershipRenewalTemplate
    };

    const templateFunction = templates[template];
    if (!templateFunction) {
      throw new Error(`Email template '${template}' not found`);
    }

    return templateFunction(context);
  }

  /**
   * Welcome email template
   */
  welcomeTemplate(context) {
    const { name, memberNumber, gymLocation, verificationUrl } = context;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FitZone Pro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ Welcome to FitZone Pro!</h1>
            <p>Your fitness journey starts here</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name}! 👋</h2>
            
            <p>Welcome to the FitZone Pro family! We're excited to have you join us at <strong>${gymLocation}</strong>.</p>
            
            <p><strong>Your Member Details:</strong></p>
            <ul>
              <li>Member Number: <strong>${memberNumber}</strong></li>
              <li>Home Gym: <strong>${gymLocation}</strong></li>
            </ul>
            
            <p>To complete your registration and activate your account, please verify your email address:</p>
            
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Complete your membership payment if you haven't already</li>
              <li>Download our mobile app for easy check-ins</li>
              <li>Book your first workout or class</li>
              <li>Meet our friendly staff for a gym tour</li>
            </ul>
            
            <p>If you have any questions, don't hesitate to contact us at <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a> or call us at ${process.env.COMPANY_PHONE}.</p>
            
            <p>Let's get fit together! 💪</p>
            
            <p>Best regards,<br>The FitZone Pro Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 FitZone Pro. All rights reserved.</p>
            <p>${process.env.COMPANY_ADDRESS}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset email template
   */
  passwordResetTemplate(context) {
    const { name, resetUrl } = context;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>We received a request to reset your FitZone Pro account password.</p>
            
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
            
            <p>If you need help, contact us at <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a></p>
            
            <p>Best regards,<br>The FitZone Pro Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 FitZone Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Membership expiry warning template
   */
  membershipExpiryTemplate(context) {
    const { name, memberNumber, expiryDate, renewalUrl, daysRemaining } = context;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Membership Renewal Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .urgent { background: #fef2f2; border: 2px solid #f87171; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Membership Renewal Reminder</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <div class="urgent">
              <h3>🚨 Your membership expires in ${daysRemaining} days!</h3>
              <p>Expiry Date: <strong>${expiryDate}</strong></p>
              <p>Member Number: <strong>${memberNumber}</strong></p>
            </div>
            
            <p>Don't let your fitness journey be interrupted! Renew your membership today to continue enjoying:</p>
            
            <ul>
              <li>✅ Full gym access</li>
              <li>✅ Group fitness classes</li>
              <li>✅ Personal training sessions</li>
              <li>✅ Premium amenities</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${renewalUrl}" class="button">Renew Membership Now</a>
            </p>
            
            <p><strong>Renewal Benefits:</strong></p>
            <ul>
              <li>🎯 Maintain your fitness momentum</li>
              <li>💰 Lock in current pricing</li>
              <li>🏆 Keep your member benefits</li>
              <li>📅 Avoid reactivation fees</li>
            </ul>
            
            <p>Questions about renewal? Contact us at <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a> or ${process.env.COMPANY_PHONE}.</p>
            
            <p>Keep crushing your goals! 💪</p>
            
            <p>Best regards,<br>The FitZone Pro Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 FitZone Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Payment confirmation template
   */
  paymentConfirmationTemplate(context) {
    const { name, amount, membershipPlan, paymentMethod, receiptNumber, membershipPeriod } = context;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .receipt { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #10b981; }
          .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
            <p>Thank you for your payment</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Your payment has been successfully processed! Here are your payment details:</p>
            
            <div class="receipt">
              <h3>📧 Receipt #${receiptNumber}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Membership Plan:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${membershipPlan}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Amount Paid:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">$${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Payment Method:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Membership Period:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${membershipPeriod}</td>
                </tr>
              </table>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>🏋️ Your membership is now active</li>
              <li>📱 Download our app for easy check-ins</li>
              <li>📅 Book your first class or training session</li>
              <li>🎯 Set up your fitness goals</li>
            </ul>
            
            <p>Keep this email as your receipt. You can also view all your payments in your member portal.</p>
            
            <p>Ready to start your workout? We can't wait to see you at the gym!</p>
            
            <p>Best regards,<br>The FitZone Pro Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 FitZone Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Public methods for different email types

  async sendWelcomeEmail(options) {
    return this.sendEmail({
      to: options.email,
      subject: '🏋️ Welcome to FitZone Pro - Let\'s Get Started!',
      template: 'welcome',
      context: options
    });
  }

  async sendPasswordResetEmail(options) {
    return this.sendEmail({
      to: options.email,
      subject: '🔐 Reset Your FitZone Pro Password',
      template: 'passwordReset',
      context: options
    });
  }

  async sendMembershipExpiryWarning(options) {
    return this.sendEmail({
      to: options.email,
      subject: `⏰ Your FitZone Pro Membership Expires in ${options.daysRemaining} Days`,
      template: 'membershipExpiry',
      context: options
    });
  }

  async sendPaymentConfirmation(options) {
    return this.sendEmail({
      to: options.email,
      subject: '✅ Payment Confirmed - FitZone Pro',
      template: 'paymentConfirmation',
      context: options
    });
  }

  async sendCustomEmail(to, subject, content, isHtml = false) {
    return this.sendEmail({
      to,
      subject,
      ...(isHtml ? { html: content } : { text: content })
    });
  }
}

// Export singleton instance
module.exports = new EmailService();