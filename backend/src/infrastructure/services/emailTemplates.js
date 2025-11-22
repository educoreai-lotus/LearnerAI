/**
 * Email Templates for Approval Notifications
 * HTML email templates for SendGrid
 */

/**
 * Approval Request Email Template
 */
export function getApprovalRequestTemplate(approvalData, learningPath, decisionMaker, frontendUrl) {
  const approvalLink = `${frontendUrl}/approvals/${approvalData.id}`;
  const pathTitle = learningPath.pathTitle || learningPath.path_title || 'Learning Path';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Learning Path Approval Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Learning Path Approval Required</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${decisionMaker.name || 'Decision Maker'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      A new learning path has been generated and requires your approval:
    </p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="color: #059669; margin-top: 0; font-size: 20px;">${pathTitle}</h2>
      ${learningPath.description ? `<p style="color: #6b7280; margin-bottom: 10px;">${learningPath.description}</p>` : ''}
      ${learningPath.duration ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Duration:</strong> ${learningPath.duration} hours</p>` : ''}
      ${learningPath.difficulty ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Difficulty:</strong> ${learningPath.difficulty}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${approvalLink}" 
         style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Review & Approve
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Approval ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${approvalData.id}</code>
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${approvalLink}" style="color: #10b981; word-break: break-all;">${approvalLink}</a>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p>This is an automated message from LearnerAI. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Approval Status Email Template (Approved)
 */
export function getApprovalStatusApprovedTemplate(approvalData, learningPath, requester, frontendUrl) {
  const pathTitle = learningPath.pathTitle || learningPath.path_title || 'Learning Path';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Learning Path Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✓ Learning Path Approved</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${requester.name || 'Learner'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! Your learning path has been <strong style="color: #10b981;">approved</strong> and is now being distributed to the Course Builder.
    </p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="color: #059669; margin-top: 0; font-size: 20px;">${pathTitle}</h2>
      <p style="color: #166534; margin: 0;">Status: <strong>Approved</strong></p>
      ${approvalData.approvedAt ? `<p style="color: #166534; margin: 5px 0 0 0;">Approved on: ${new Date(approvalData.approvedAt).toLocaleDateString()}</p>` : ''}
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Your learning path will be available in the Course Builder shortly. You can start your learning journey!
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p>This is an automated message from LearnerAI. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Approval Status Email Template (Changes Requested)
 */
export function getApprovalStatusChangesRequestedTemplate(approvalData, learningPath, requester, frontendUrl) {
  const pathTitle = learningPath.pathTitle || learningPath.path_title || 'Learning Path';
  const feedback = approvalData.feedback || 'No specific feedback provided.';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Changes Requested for Learning Path</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Changes Requested</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${requester.name || 'Learner'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      The decision maker has reviewed your learning path and requested some changes before approval.
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="color: #d97706; margin-top: 0; font-size: 20px;">${pathTitle}</h2>
      <p style="color: #92400e; margin: 0;">Status: <strong>Changes Requested</strong></p>
    </div>
    
    <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">Feedback from Decision Maker:</h3>
      <p style="color: #78350f; white-space: pre-wrap; margin: 0;">${feedback}</p>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Please review the feedback and make the necessary changes. Once updated, the learning path will be resubmitted for approval.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p>This is an automated message from LearnerAI. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

