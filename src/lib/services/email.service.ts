/**
 * Email Service
 * Handles sending transactional emails via Resend
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@modelmagic.com'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ModelMagic'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send intake confirmation email
 */
export async function sendIntakeConfirmation(
  to: string,
  data: {
    clientName: string
    projectId: string
    productType: string
  }
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME}: We received your project request!`,
      html: `
        <h1>Thank you, ${data.clientName}!</h1>
        <p>We've received your project request for <strong>${data.productType}</strong>.</p>
        <p>Our team will review your submission and get back to you shortly with package options and pricing.</p>
        <p>
          <strong>Project ID:</strong> ${data.projectId.slice(0, 8)}...
        </p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This email was sent by ${APP_NAME}. If you didn't submit this request, please ignore this email.
        </p>
      `,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send intake confirmation:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send payment request email
 */
export async function sendPaymentRequest(
  to: string,
  data: {
    clientName: string
    projectId: string
    packageType: string
    paymentUrl: string
  }
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME}: Your package is ready - Complete payment`,
      html: `
        <h1>Hi ${data.clientName},</h1>
        <p>Great news! We've reviewed your project and prepared a package for you.</p>
        <p><strong>Package:</strong> ${data.packageType}</p>
        <p>Click the button below to complete your payment and get started:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.paymentUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Complete Payment
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link: ${data.paymentUrl}
        </p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Project ID: ${data.projectId.slice(0, 8)}...
        </p>
      `,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send payment request:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send magic link email
 */
export async function sendMagicLink(
  to: string,
  data: {
    clientName: string
    magicLinkUrl: string
    expiresIn: string
  }
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME}: Your login link`,
      html: `
        <h1>Hi ${data.clientName},</h1>
        <p>Click the link below to access your dashboard:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.magicLinkUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Dashboard
          </a>
        </p>
        <p style="color: #666;">This link expires in ${data.expiresIn}.</p>
        <p style="color: #666; font-size: 12px;">
          If you didn't request this link, you can safely ignore this email.
        </p>
      `,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send magic link:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send assets ready notification
 */
export async function sendAssetsReady(
  to: string,
  data: {
    clientName: string
    projectId: string
    assetCount: number
    dashboardUrl: string
  }
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME}: Your model shots are ready for review!`,
      html: `
        <h1>Hi ${data.clientName},</h1>
        <p>Exciting news! Your AI model shots are ready for review.</p>
        <p><strong>${data.assetCount} images</strong> are waiting for you.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review Your Images
          </a>
        </p>
        <p>Please review the images and let us know if you'd like any revisions.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Project ID: ${data.projectId.slice(0, 8)}...
        </p>
      `,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send assets ready email:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send revision request notification to admin
 */
export async function sendRevisionNotification(
  to: string,
  data: {
    clientName: string
    clientEmail: string
    projectId: string
    revisionNotes: string
  }
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME}: Revision requested - ${data.clientName}`,
      html: `
        <h1>Revision Request</h1>
        <p><strong>Client:</strong> ${data.clientName} (${data.clientEmail})</p>
        <p><strong>Project ID:</strong> ${data.projectId}</p>
        <h2>Revision Notes:</h2>
        <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4F46E5;">
          ${data.revisionNotes}
        </blockquote>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/admin/projects/${data.projectId}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Project
          </a>
        </p>
      `,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send revision notification:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send project completion email
 */
export async function sendProjectCompleted(
  to: string,
  data: {
    clientName: string
    projectId: string
    dashboardUrl: string
  }
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME}: Your project is complete!`,
      html: `
        <h1>Congratulations, ${data.clientName}!</h1>
        <p>Your project has been completed and all assets are ready for download.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Download Your Images
          </a>
        </p>
        <p>Thank you for choosing ${APP_NAME}! We hope you love your new product photos.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Project ID: ${data.projectId.slice(0, 8)}...
        </p>
      `,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Failed to send completion email:', error)
    return { success: false, error: String(error) }
  }
}
