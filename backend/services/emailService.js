const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL || "adriansimon477@gmail.com";
const FROM_EMAIL = "support@enfora.app";

/**
 * Send task review notification email to reviewers
 * @param {Object} taskData - Task and user information
 * @param {string} taskData.taskId - Task ID
 * @param {string} taskData.taskName - Task name/title
 * @param {string} taskData.taskDescription - Task description
 * @param {string} taskData.userId - User ID
 * @param {string} taskData.username - Username
 * @param {string} taskData.displayName - User display name
 * @param {string} taskData.aiRejectionReason - AI's reasoning for rejection
 * @param {string} taskData.disputeReasoning - User's dispute reasoning
 * @param {string} taskData.disputedAt - Dispute date and time
 * @param {string} taskData.evidenceURL - Link to submitted evidence
 */
async function sendTaskReviewNotification(taskData) {
  const {
    taskId,
    taskName,
    taskDescription,
    userId,
    username,
    displayName,
    aiRejectionReason,
    disputeReasoning,
    disputedAt,
    evidenceURL,
  } = taskData;

  // Format the dispute date for better readability
  const formattedDate = new Date(disputedAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #d9534f;
            font-size: 24px;
          }
          .section {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .section h2 {
            margin-top: 0;
            color: #495057;
            font-size: 18px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
          }
          .field {
            margin-bottom: 15px;
          }
          .field-label {
            font-weight: 600;
            color: #6c757d;
            display: block;
            margin-bottom: 5px;
          }
          .field-value {
            color: #212529;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            word-wrap: break-word;
          }
          .evidence-link {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
          }
          .evidence-link:hover {
            background-color: #0056b3;
          }
          .footer {
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .rejection-reason {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            border-radius: 4px;
          }
          .dispute-reason {
            background-color: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 10px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Task Pending Review</h1>
        </div>

        <div class="section">
          <h2>Task Information</h2>
          <div class="field">
            <span class="field-label">Task ID:</span>
            <div class="field-value">${taskId}</div>
          </div>
          <div class="field">
            <span class="field-label">Task Name:</span>
            <div class="field-value">${taskName || 'No title provided'}</div>
          </div>
          <div class="field">
            <span class="field-label">Task Description:</span>
            <div class="field-value">${taskDescription || 'No description provided'}</div>
          </div>
        </div>

        <div class="section">
          <h2>User Information</h2>
          <div class="field">
            <span class="field-label">User ID:</span>
            <div class="field-value">${userId}</div>
          </div>
          <div class="field">
            <span class="field-label">Username:</span>
            <div class="field-value">@${username}</div>
          </div>
          <div class="field">
            <span class="field-label">Display Name:</span>
            <div class="field-value">${displayName || username}</div>
          </div>
        </div>

        <div class="section">
          <h2>AI Rejection Details</h2>
          <div class="field">
            <span class="field-label">AI Reasoning for Rejection:</span>
            <div class="field-value rejection-reason">${aiRejectionReason}</div>
          </div>
        </div>

        <div class="section">
          <h2>Dispute Information</h2>
          <div class="field">
            <span class="field-label">User's Dispute Reasoning:</span>
            <div class="field-value dispute-reason">${disputeReasoning}</div>
          </div>
          <div class="field">
            <span class="field-label">Dispute Date & Time:</span>
            <div class="field-value">${formattedDate}</div>
          </div>
        </div>

        <div class="section">
          <h2>Evidence Submitted</h2>
          <div class="field">
            <a href="${evidenceURL}" class="evidence-link" target="_blank">View Submitted Evidence</a>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated notification from Enfora.</p>
          <p>Please review the task and make a decision on the dispute.</p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
TASK PENDING REVIEW

Task Information:
- Task ID: ${taskId}
- Task Name: ${taskName || 'No title provided'}
- Task Description: ${taskDescription || 'No description provided'}

User Information:
- User ID: ${userId}
- Username: @${username}
- Display Name: ${displayName || username}

AI Rejection Details:
- AI Reasoning for Rejection: ${aiRejectionReason}

Dispute Information:
- User's Dispute Reasoning: ${disputeReasoning}
- Dispute Date & Time: ${formattedDate}

Evidence Submitted:
${evidenceURL}

---
This is an automated notification from Enfora.
Please review the task and make a decision on the dispute.
  `;

  const params = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [REVIEWER_EMAIL],
    },
    Message: {
      Subject: {
        Data: "Task Pending Review",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await ses.send(command);
    return response;
  } catch (error) {
    console.error("Error sending task review notification:", error);
    throw error;
  }
}

/**
 * Send email verification code to user
 * @param {Object} data - Email and verification data
 * @param {string} data.email - User's email address
 * @param {string} data.verificationCode - 6-digit verification code
 * @param {string} data.username - User's username
 */
async function sendVerificationCode(data) {
  const { email, verificationCode, username } = data;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #000000;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            text-align: center;
            margin-bottom: 30px;
          }
          .content p {
            color: #666;
            font-size: 16px;
            margin: 10px 0;
          }
          .verification-code {
            background: linear-gradient(135deg, #000000 0%, #333333 100%);
            color: white;
            font-size: 36px;
            font-weight: 600;
            letter-spacing: 8px;
            padding: 20px 40px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            text-align: left;
          }
          .warning p {
            margin: 5px 0;
            color: #856404;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Enfora!</h1>
          </div>

          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>

            <div class="verification-code">${verificationCode}</div>

            <p>This code will expire in <strong>10 minutes</strong>.</p>
          </div>

          <div class="warning">
            <p><strong>Security Note:</strong></p>
            <p>• Never share this code with anyone</p>
            <p>• Enfora will never ask you for this code via phone or email</p>
            <p>• If you didn't request this code, you can safely ignore this email</p>
          </div>

          <div class="footer">
            <p>This is an automated message from Enfora.</p>
            <p>If you have any questions, please contact us at support@enfora.app</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Welcome to Enfora!

Hello ${username},

Thank you for signing up! To complete your registration, please verify your email address using the code below:

VERIFICATION CODE: ${verificationCode}

This code will expire in 10 minutes.

SECURITY NOTE:
• Never share this code with anyone
• Enfora will never ask you for this code via phone or email
• If you didn't request this code, you can safely ignore this email

---
This is an automated message from Enfora.
If you have any questions, please contact us at support@enfora.app
  `;

  const params = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Your Enfora Verification Code: ${verificationCode}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await ses.send(command);
    return response;
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw error;
  }
}

/**
 * Send account deletion verification code
 * @param {Object} data - Email and verification data
 * @param {string} data.email - User's email address
 * @param {string} data.verificationCode - 6-digit verification code
 * @param {string} data.username - User's username
 */
async function sendAccountDeletionCode(data) {
  const { email, verificationCode, username } = data;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #dc3545;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            text-align: center;
            margin-bottom: 30px;
          }
          .content p {
            color: #666;
            font-size: 16px;
            margin: 10px 0;
          }
          .verification-code {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            font-size: 36px;
            font-weight: 600;
            letter-spacing: 8px;
            padding: 20px 40px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .warning {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            text-align: left;
          }
          .warning p {
            margin: 5px 0;
            color: #721c24;
            font-size: 14px;
          }
          .warning strong {
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Account Deletion Request</h1>
          </div>

          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>We received a request to delete your Enfora account. To confirm this action, please use the verification code below:</p>

            <div class="verification-code">${verificationCode}</div>

            <p>This code will expire in <strong>10 minutes</strong>.</p>
          </div>

          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <p>• Deleting your account is <strong>permanent and cannot be undone</strong></p>
            <p>• All your data, tasks, and progress will be permanently removed</p>
            <p>• If you didn't request this, please change your password to secure your account</p>
            <p>• Never share this code with anyone</p>
          </div>

          <div class="footer">
            <p>This is an automated message from Enfora.</p>
            <p>If you have any questions, please contact us at support@enfora.app</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
ACCOUNT DELETION REQUEST

Hello ${username},

We received a request to delete your Enfora account. To confirm this action, please use the verification code below:

VERIFICATION CODE: ${verificationCode}

This code will expire in 10 minutes.

⚠️ IMPORTANT:
• Deleting your account is PERMANENT and CANNOT BE UNDONE
• All your data, tasks, and progress will be permanently removed
• If you didn't request this, please ignore this email and secure your account
• Never share this code with anyone

---
This is an automated message from Enfora.
If you have any questions, please contact us at support@enfora.app
  `;

  const params = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Account Deletion Verification Code: ${verificationCode}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await ses.send(command);
    return response;
  } catch (error) {
    console.error("Error sending account deletion code:", error);
    throw error;
  }
}

/**
 * Send account deletion confirmation email
 * @param {Object} data - Email data
 * @param {string} data.email - User's email address
 * @param {string} data.username - User's username
 */
async function sendAccountDeletionConfirmation(data) {
  const { email, username } = data;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #000000;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            text-align: center;
            margin-bottom: 30px;
          }
          .content p {
            color: #666;
            font-size: 16px;
            margin: 15px 0;
            line-height: 1.8;
          }
          .goodbye-message {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .goodbye-message h2 {
            margin: 0 0 15px 0;
            font-size: 24px;
            font-weight: 300;
          }
          .goodbye-message p {
            color: rgba(255, 255, 255, 0.95);
            margin: 10px 0;
          }
          .info-box {
            background-color: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: left;
          }
          .info-box p {
            margin: 8px 0;
            color: #1565c0;
            font-size: 14px;
          }
          .info-box strong {
            color: #0d47a1;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .cta-button {
            display: inline-block;
            background-color: #000000;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deleted</h1>
          </div>

          <div class="content">
            <div class="goodbye-message">
              <h2>Goodbye, ${username}</h2>
              <p>Your Enfora account has been successfully deleted.</p>
            </div>

            <p>We're sorry to see you go. Your account and all associated data have been permanently removed from our systems.</p>

            <div class="info-box">
              <p><strong>What's been deleted:</strong></p>
              <p>• Your profile and account information</p>
              <p>• All tasks and progress data</p>
              <p>• Achievement history and analytics</p>
              <p>• All personal preferences and settings</p>
            </div>

            <p>If you change your mind, you're always welcome to create a new account and rejoin the Enfora community.</p>

            <a href="https://enfora.app" class="cta-button">Visit Enfora</a>
          </div>

          <div class="footer">
            <p>Thank you for being part of Enfora.</p>
            <p>If you have any feedback about your experience, we'd love to hear from you at support@enfora.app</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
ACCOUNT DELETED

Goodbye, ${username}

Your Enfora account has been successfully deleted.

We're sorry to see you go. Your account and all associated data have been permanently removed from our systems.

WHAT'S BEEN DELETED:
• Your profile and account information
• All tasks and progress data
• Achievement history and analytics
• All personal preferences and settings

If you change your mind, you're always welcome to create a new account and rejoin the Enfora community.

Visit us at: https://enfora.app

---
Thank you for being part of Enfora.
If you have any feedback about your experience, we'd love to hear from you at support@enfora.app
  `;

  const params = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Your Enfora Account Has Been Deleted",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await ses.send(command);
    return response;
  } catch (error) {
    console.error("Error sending account deletion confirmation:", error);
    throw error;
  }
}

/**
 * Send 2FA verification code to user
 * @param {Object} data - Email and verification data
 * @param {string} data.email - User's email address
 * @param {string} data.verificationCode - 6-digit verification code
 */
async function send2FACode(data) {
  const { email, verificationCode } = data;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #000;
            margin: 0;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            text-align: center;
            margin: 30px 0;
          }
          .code-container {
            background-color: #f8f9fa;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
          .code {
            font-size: 36px;
            font-weight: 600;
            letter-spacing: 8px;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Two-Factor Authentication</h1>
          </div>

          <div class="content">
            <p>You're signing in to your Enfora account. Use the verification code below to complete your login:</p>
          </div>

          <div class="code-container">
            <div class="code">${verificationCode}</div>
          </div>

          <div class="content">
            <p>This code will expire in <strong>10 minutes</strong>.</p>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> If you didn't attempt to sign in to Enfora, please ignore this email and ensure your account is secure.
          </div>

          <div class="footer">
            <p>This is an automated message from Enfora.</p>
            <p>Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Two-Factor Authentication

You're signing in to your Enfora account.

Your verification code is: ${verificationCode}

This code will expire in 10 minutes.

SECURITY NOTICE:
If you didn't attempt to sign in to Enfora, please ignore this email and ensure your account is secure.

---
This is an automated message from Enfora.
Do not reply to this email.
  `;

  const params = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Your Enfora Login Code",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await ses.send(command);
    return response;
  } catch (error) {
    console.error("Error sending 2FA code:", error);
    throw error;
  }
}

module.exports = {
  sendTaskReviewNotification,
  sendVerificationCode,
  sendAccountDeletionCode,
  sendAccountDeletionConfirmation,
  send2FACode,
};
