// ============================================================
// Netlify Function: submit-photo-quote
// Receives customer info + Cloudinary image URLs.
// Sends a formatted HTML notification email to the business owner.
//
// Required env vars:
//   SMTP_USER      = your Gmail address (e.g. info@ggcleaningli.com)
//   SMTP_APP_PASS  = Gmail App Password (NOT your regular password)
//   OWNER_EMAIL    = recipient email for notifications (defaults to SMTP_USER)
// ============================================================

import nodemailer from 'nodemailer';
import { qualifyServiceZip } from '../../src/utils/zipValidation.js';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const { name, email, phone, address, serviceType, estimateRange, zipCode, zip, images = {} } = body;

        // Server-Authoritative ZIP Enforcement
        const rawZip = zipCode || zip || (address ? address.match(/\b\d{5}\b/)?.[0] : '');
        if (rawZip) {
            const zipCheck = qualifyServiceZip(rawZip);
            if (!zipCheck.isServiceable) {
                return {
                    statusCode: 422,
                    headers,
                    body: JSON.stringify({
                        error: 'OUTSIDE_SERVICE_AREA',
                        code: 'OUTSIDE_SERVICE_AREA',
                        message: 'Photo quotes are currently available for Nassau and Suffolk County addresses only.',
                        details: { normalizedZip: zipCheck.normalizedZip, status: zipCheck.status, isServiceable: zipCheck.isServiceable }
                    })
                };
            }
        }

        // Build image HTML for the email body
        const imgSection = (label, urls = []) => {
            if (!urls.length) return `<p><strong>${label}:</strong> No photos uploaded</p>`;
            const imgs = urls.map((u) => `<a href="${u}" target="_blank"><img src="${u}" width="200" style="margin:4px;border-radius:6px;" /></a>`).join('');
            return `<div style="margin-bottom:12px;"><strong>${label}:</strong><br/>${imgs}</div>`;
        };

        const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#581c87;padding:16px 24px;border-radius:10px 10px 0 0;">
    <h2 style="color:#fff;margin:0;">📸 New Photo Quote Request</h2>
    <p style="color:#e9d5ff;margin:6px 0 0;">G&G Cleaning Services — Review Required</p>
  </div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:0 0 10px 10px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px;font-weight:600;width:140px;">Name</td><td style="padding:6px;">${name}</td></tr>
      <tr><td style="padding:6px;font-weight:600;">Email</td><td style="padding:6px;"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:6px;font-weight:600;">Phone</td><td style="padding:6px;"><a href="tel:${phone}">${phone}</a></td></tr>
      <tr><td style="padding:6px;font-weight:600;">Address</td><td style="padding:6px;">${address || 'Not provided'}</td></tr>
      <tr><td style="padding:6px;font-weight:600;">Service</td><td style="padding:6px;">${serviceType || 'Not specified'}</td></tr>
      <tr><td style="padding:6px;font-weight:600;">Estimate Shown</td><td style="padding:6px;font-size:18px;color:#581c87;font-weight:700;">${estimateRange || 'N/A'}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <h3 style="color:#581c87;margin-bottom:12px;">Uploaded Photos</h3>
    ${imgSection('🍳 Kitchen', images.kitchen)}
    ${imgSection('🛁 Bathroom(s)', images.bathroom)}
    ${imgSection('🛋️ Living Area', images.living)}
    ${imgSection('⚠️ Problem Areas', images.optional)}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <p style="font-size:13px;color:#6b7280;">
      Reply to this email or text ${phone} to deliver the final quote.<br/>
      <strong>Target response time: within 1–2 hours.</strong>
    </p>
  </div>
</div>`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_APP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"G&G Cleaning — Quote Bot" <${process.env.SMTP_USER}>`,
            to: process.env.OWNER_EMAIL || process.env.SMTP_USER,
            replyTo: email,
            subject: `📸 Photo Quote Request from ${name} — ${serviceType || 'Cleaning'}`,
            html,
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (error) {
        console.error('submit-photo-quote error:', error.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

