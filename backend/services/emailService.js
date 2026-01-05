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
    console.log(`Task review notification sent successfully. MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error("Error sending task review notification:", error);
    throw error;
  }
}

module.exports = {
  sendTaskReviewNotification,
};
