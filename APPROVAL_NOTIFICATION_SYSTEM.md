# 📧 Approval Notification System

## Current Implementation Status

### ✅ What's Implemented

The approval workflow is **designed for email notifications**, but currently **only logs to console** (not production-ready).

### 📋 How It Works

1. **When an approval is needed:**
   - Learning path is generated
   - System checks company's approval policy
   - If `approval_policy: 'manual'`, an approval request is created
   - Notification is sent to the decision maker

2. **Notification Flow:**
   ```
   GenerateLearningPathUseCase
   → CheckApprovalPolicyUseCase (checks if manual approval needed)
   → RequestPathApprovalUseCase (creates approval request)
   → NotificationService.sendApprovalRequest() (sends notification)
   ```

3. **Current Implementation:**
   - ✅ Approval requests are created in database
   - ✅ Decision maker info is retrieved from company data
   - ⚠️ **Notifications are logged to console only** (not actually sent)

---

## 🔍 Current Code Status

### NotificationService (`backend/src/infrastructure/services/NotificationService.js`)

**Current State:**
```javascript
async sendApprovalRequest(approvalData, learningPath, decisionMaker) {
  // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
  // For now, log the notification
  console.log('📧 Approval Request Notification:');
  console.log(`   To: ${decisionMaker.email}`);
  console.log(`   Subject: Learning Path Approval Required`);
  console.log(`   Link: ${FRONTEND_URL}/approvals/${approvalData.id}`);
  
  // In production: Should send actual email
}
```

**What it logs:**
- Decision maker's email address
- Approval request ID
- Learning path details
- Frontend URL link to approve/reject

**What it should do:**
- Send actual email via SendGrid, AWS SES, or similar
- Include approval link in email
- Send follow-up notifications on status changes

---

## 📧 Email vs In-App Notifications

### Current Design: **Email-Based**

The system is designed to send **email notifications** to decision makers:

1. **Email contains:**
   - Approval request details
   - Learning path information
   - Direct link to approve/reject: `${FRONTEND_URL}/approvals/{approvalId}`
   - Decision maker's email from company `decision_maker` JSONB field

2. **Decision maker receives:**
   - Email notification
   - Clicks link to go to frontend
   - Approves/rejects in the UI
   - System sends status update email

### Alternative: In-App Notifications

Currently **NOT implemented**, but could be added:
- Push notifications
- In-app notification center
- Real-time updates via WebSocket

---

## 🚀 To Make It Production-Ready

### Option 1: SendGrid Integration (Recommended)

```javascript
// In NotificationService.js
import sgMail from '@sendgrid/mail';

constructor() {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async sendApprovalRequest(approvalData, learningPath, decisionMaker) {
  const msg = {
    to: decisionMaker.email,
    from: process.env.FROM_EMAIL || 'noreply@learnerai.com',
    subject: `Learning Path Approval Required - ${learningPath.pathTitle}`,
    templateId: 'your-sendgrid-template-id',
    dynamicTemplateData: {
      approvalId: approvalData.id,
      learningPathTitle: learningPath.pathTitle,
      approvalLink: `${process.env.FRONTEND_URL}/approvals/${approvalData.id}`,
      decisionMakerName: decisionMaker.name
    }
  };
  
  await sgMail.send(msg);
}
```

**Required:**
- SendGrid account
- `SENDGRID_API_KEY` environment variable
- Email template in SendGrid

### Option 2: AWS SES Integration

```javascript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

constructor() {
  this.sesClient = new SESClient({ region: process.env.AWS_REGION });
}

async sendApprovalRequest(approvalData, learningPath, decisionMaker) {
  const command = new SendEmailCommand({
    Source: process.env.FROM_EMAIL,
    Destination: { ToAddresses: [decisionMaker.email] },
    Message: {
      Subject: { Data: `Learning Path Approval Required` },
      Body: {
        Html: {
          Data: `
            <h2>Approval Required</h2>
            <p>Please review and approve the learning path.</p>
            <a href="${process.env.FRONTEND_URL}/approvals/${approvalData.id}">
              Review Approval Request
            </a>
          `
        }
      }
    }
  });
  
  await this.sesClient.send(command);
}
```

**Required:**
- AWS account with SES configured
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Verified sender email

### Option 3: Nodemailer (Simple SMTP)

```javascript
import nodemailer from 'nodemailer';

constructor() {
  this.transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async sendApprovalRequest(approvalData, learningPath, decisionMaker) {
  await this.transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: decisionMaker.email,
    subject: `Learning Path Approval Required`,
    html: `
      <h2>Approval Required</h2>
      <p>Click <a href="${process.env.FRONTEND_URL}/approvals/${approvalData.id}">here</a> to review.</p>
    `
  });
}
```

---

## 📊 Current Workflow

### Step-by-Step Flow

1. **Learning Path Generated**
   ```
   Skills Engine → GenerateLearningPathUseCase
   ```

2. **Check Approval Policy**
   ```
   CheckApprovalPolicyUseCase.execute(companyId)
   → Returns: { requiresApproval: true/false, company: {...} }
   ```

3. **If Manual Approval Required**
   ```
   RequestPathApprovalUseCase.execute({
     learningPathId,
     companyId,
     decisionMaker: company.decision_maker, // { employee_id, name, email }
     learningPath
   })
   ```

4. **Create Approval Request**
   ```
   → Saves to path_approvals table
   → Status: 'pending'
   ```

5. **Send Notification** (Currently logs only)
   ```
   NotificationService.sendApprovalRequest()
   → Logs email details to console
   → Should send actual email
   ```

6. **Decision Maker Reviews**
   ```
   Frontend: GET /api/v1/approvals/:approvalId
   → Shows approval request details
   ```

7. **Decision Made**
   ```
   POST /api/v1/approvals/:approvalId/approve
   POST /api/v1/approvals/:approvalId/reject
   → Updates approval status
   → Sends status notification (currently logs only)
   → If approved: Distributes path to Course Builder
   ```

---

## 🔧 Implementation Checklist

### To Make Email Notifications Work:

- [ ] Choose email service (SendGrid, AWS SES, or Nodemailer)
- [ ] Install email service package
- [ ] Add email service API keys to environment variables
- [ ] Update `NotificationService.sendApprovalRequest()` to send actual emails
- [ ] Update `NotificationService.sendApprovalStatus()` to send status emails
- [ ] Create email templates (HTML)
- [ ] Test email delivery
- [ ] Handle email delivery failures gracefully

### Environment Variables Needed:

```bash
# For SendGrid
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com

# OR for AWS SES
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
FROM_EMAIL=noreply@yourdomain.com

# OR for SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
```

---

## 📝 Summary

**Current Status:**
- ✅ Approval workflow logic is complete
- ✅ Database storage works
- ✅ API endpoints are ready
- ⚠️ **Email notifications are NOT implemented** (only console logs)

**What's Needed:**
- Integrate email service (SendGrid/AWS SES/Nodemailer)
- Update `NotificationService` to send actual emails
- Add email templates
- Configure environment variables

**Design:**
- System is designed for **email-based notifications**
- Decision makers receive email with approval link
- They click link → go to frontend → approve/reject
- Status update emails are sent after decision

---

**Last Updated:** 2025-01-21

