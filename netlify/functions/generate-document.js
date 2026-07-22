import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { DOCUMENT_CONFIG, PROPOSAL_MAP, AGREEMENT_MAP } from './utils/documentCoordinateMaps.js';
import { requireStaffAuth } from './utils/requireStaffAuth.js';

const getDirName = () => {
  if (typeof __dirname !== 'undefined') return __dirname;
  return process.cwd();
};
const __dir = getDirName();

// Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERNAL_ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  // Dual Authorization: Staff Bearer JWT (Browser) OR Server-to-Server x-admin-secret
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const adminSecret = event.headers['x-admin-secret'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const authResult = await requireStaffAuth(event, { allowedRoles: ['owner_admin', 'staff'] });
    if (!authResult.authorized) {
      return { statusCode: authResult.statusCode || 401, headers, body: JSON.stringify({ error: authResult.error || 'Unauthorized staff session' }) };
    }
  } else if (INTERNAL_ADMIN_SECRET && adminSecret === INTERNAL_ADMIN_SECRET) {
    // Authorized server-to-server call
  } else {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized staff bearer authorization or valid server secret required' }) };
  }

  const { internalQuoteId, documentType } = JSON.parse(event.body);

  if (!internalQuoteId || !documentType) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing internalQuoteId or documentType' }) };
  }

  try {
    // 1. Load Quote & Customer Data from Supabase
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, customer:customers(*)')
      .eq('internal_quote_id', internalQuoteId)
      .single();

    if (quoteError || !quote) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Quote not found' }) };
    }

    const customer = quote.customer;
    const quoteData = quote.quote_payload; // The raw object from frontend

    // 2. Prepare PDF
    const templateName = documentType === 'proposal' ? 'proposal-blank.pdf' : 'agreement-blank.pdf';
    const templatePath = path.join(__dir, 'templates', templateName);
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. Map & Draw Data
    if (documentType === 'proposal') {
      await fillProposal(pdfDoc, quote, customer, quoteData, helveticaFont, helveticaBold);
    } else {
      await fillAgreement(pdfDoc, quote, customer, quoteData, helveticaFont, helveticaBold);
    }

    const pdfBytes = await pdfDoc.save();

    // 4. Upload to Supabase Storage
    const fileName = `${documentType}.pdf`;
    const storagePath = `quotes/${internalQuoteId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    // 6. Update Database
    const updatePayload = {};
    if (documentType === 'proposal') {
      updatePayload.proposal_pdf_url = publicUrl;
      updatePayload.proposal_status = 'generated';
      updatePayload.proposal_generated_at = new Date().toISOString();
    } else {
      updatePayload.agreement_url = publicUrl;
      updatePayload.agreement_status = 'generated';
      updatePayload.agreement_generated_at = new Date().toISOString();
    }

    await supabase.from('quotes').update(updatePayload).eq('id', quote.id);

    // 7. Audit Log
    await createAuditLog(documentType, quote.id, internalQuoteId, `${documentType}_generated`, { url: publicUrl });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        documentType,
        url: publicUrl,
        internalQuoteId
      })
    };

  } catch (error) {
    console.error(`[Document Generation Error]`, error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

/**
 * Helper to draw text on a page
 */
function drawText(page, text, mapEntry, font, boldFont) {
    if (!text || !mapEntry) return;
    
    const size = mapEntry.size || DOCUMENT_CONFIG.font.size.default;
    const color = mapEntry.color ? rgb(...DOCUMENT_CONFIG.font.color[mapEntry.color]) : rgb(...DOCUMENT_CONFIG.font.color.navy);
    const selectedFont = mapEntry.bold ? boldFont : font;

    page.drawText(String(text), {
        x: mapEntry.x,
        y: mapEntry.y,
        size,
        font: selectedFont,
        color
    });
}

async function fillProposal(pdfDoc, quote, customer, data, font, boldFont) {
    const pages = pdfDoc.getPages();
    const p1 = pages[0];
    const p2 = pages[1];
    const map = PROPOSAL_MAP;

    // PAGE 1
    drawText(p1, "[X]", map.page1.oneTimeTick, font, boldFont);
    drawText(p1, `Date: ${new Date().toLocaleDateString()}`, map.page1.dateIssued, font, boldFont);

    // Client Info
    drawText(p1, `${customer.first_name} ${customer.last_name}`, map.page1.clientName, font, boldFont);
    drawText(p1, customer.phone, map.page1.clientPhone, font, boldFont);
    drawText(p1, customer.email, map.page1.clientEmail, font, boldFont);
    drawText(p1, customer.address_line_1, map.page1.clientAddress, font, boldFont);
    drawText(p1, `${customer.city}, ${customer.postal_code}`, map.page1.clientCityZip, font, boldFont);

    // Property Details
    drawText(p1, data.propertyType || 'Residential', map.page1.propertyType, font, boldFont);
    drawText(p1, data.bedrooms || '0', map.page1.bedrooms, font, boldFont);
    drawText(p1, data.bathrooms || '0', map.page1.bathrooms, font, boldFont);
    drawText(p1, data.condition || 'Standard', map.page1.condition, font, boldFont);
    
    const addOnsList = data.addOns?.map(a => a.name).join(', ') || 'None';
    drawText(p1, addOnsList, map.page1.addons, font, boldFont);

    // Plan Overview
    drawText(p1, data.selectedPlan?.name || 'Standard', map.page1.planName, font, boldFont);
    drawText(p1, data.frequency || 'One-Time', map.page1.frequency, font, boldFont);
    drawText(p1, "1", map.page1.month1Visits, font, boldFont); // Default
    drawText(p1, data.frequency === 'One-Time' ? 'N/A' : 'TBD', map.page1.ongoingVisits, font, boldFont);
    drawText(p1, `$${data.travelFee || 0}`, map.page1.travelFeeLabel, font, boldFont);

    // Pricing Breakdown
    drawText(p1, `$${data.basePrice?.toFixed(2)}`, map.page1.basePrice, font, boldFont);
    drawText(p1, `x${data.serviceMult || 1.0}`, map.page1.serviceMult, font, boldFont);
    drawText(p1, `x${data.conditionMult || 1.0}`, map.page1.conditionMult, font, boldFont);
    drawText(p1, `$${data.subtotal?.toFixed(2)}`, map.page1.subtotal, font, boldFont);
    drawText(p1, `-$${data.planDiscountAmount?.toFixed(2) || '0.00'}`, map.page1.discount, font, boldFont);

    // Appointment
    drawText(p1, `Appointment: TBD | ${customer.address_line_1}`, map.page1.appointmentNote, font, boldFont);

    // PAGE 2
    drawText(p2, `-$${data.firstTimeDiscount?.toFixed(2) || '0.00'}`, map.page2.firstTimeDiscount, font, boldFont);
    drawText(p2, `+$${data.addOnsTotal?.toFixed(2) || '0.00'}`, map.page2.addonsTotal, font, boldFont);
    drawText(p2, `+$${data.travelFee?.toFixed(2) || '0.00'}`, map.page2.travelFeeAmount, font, boldFont);

    // Summary Totals
    const total = data.quoteTotal || 0;
    const deposit = data.depositAmount || (total * 0.25);
    const balance = total - deposit;

    drawText(p2, `$${total.toFixed(2)}`, map.page2.firstMonthTotal, font, boldFont);
    drawText(p2, `$${total.toFixed(2)} total`, map.page2.firstMonthPerVisit, font, boldFont);
    
    if (data.frequency === 'One-Time') {
        drawText(p2, 'N/A', map.page2.ongoingMonthly, font, boldFont);
        drawText(p2, 'One-Time Service', map.page2.ongoingPerVisit, font, boldFont);
    } else {
        // Handle ongoing calculation if needed
        drawText(p2, 'TBD', map.page2.ongoingMonthly, font, boldFont);
    }

    drawText(p2, `$${deposit.toFixed(2)}`, map.page2.depositToday, font, boldFont);
    drawText(p2, '25% of total', map.page2.depositNote, font, boldFont);
    drawText(p2, `Balance due: $${balance.toFixed(2)}`, map.page2.balanceNote, font, boldFont);
}

async function fillAgreement(pdfDoc, quote, customer, data, font, boldFont) {
    const pages = pdfDoc.getPages();
    const p1 = pages[0];
    const map = AGREEMENT_MAP;

    drawText(p1, `${customer.first_name} ${customer.last_name}`, map.page1.clientName, font, boldFont);
    drawText(p1, new Date().toLocaleDateString(), map.page1.date, font, boldFont);
    drawText(p1, customer.address_line_1, map.page1.serviceAddress, font, boldFont);
    drawText(p1, `${customer.city}, ${customer.postal_code}`, map.page1.cityZip, font, boldFont);
    drawText(p1, customer.phone, map.page1.phone, font, boldFont);
    drawText(p1, customer.email, map.page1.email, font, boldFont);
    drawText(p1, data.selectedPlan?.name || 'Cleaning Service', map.page1.serviceType, font, boldFont);
    drawText(p1, 'TBD', map.page1.serviceDate, font, boldFont);
    drawText(p1, `$${data.quoteTotal?.toFixed(2)}`, map.page1.estimatedTotal, font, boldFont);
    drawText(p1, `$${(data.quoteTotal * 0.25).toFixed(2)}`, map.page1.depositAmount, font, boldFont);
    drawText(p1, data.frequency || 'One-Time', map.page1.frequency, font, boldFont);
    drawText(p1, 'To be assigned', map.page1.assignedCleaner, font, boldFont);
}

async function createAuditLog(entityType, entityId, internalQuoteId, action, details = {}) {
  try {
    await supabase.from('audit_logs').insert([{
      entity_type: entityType,
      entity_id: entityId,
      internal_quote_id: internalQuoteId,
      action: action,
      actor: 'system',
      metadata: details
    }]);
  } catch (e) {
    console.error('Failed to create audit log:', e);
  }
}
