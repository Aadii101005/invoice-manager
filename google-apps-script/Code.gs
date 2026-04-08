/**
 * Automated Invoice Generation System
 * Author: Antigravity AI
 */

const SHOP_NAME = "Modern Global Store";
const SHOP_ADDRESS = "123 Business Ave, Tech City, TC 10101";
const SHOP_CONTACT = "+1 234 567 8900";
const TAX_RATE = 0.18; // 18% GST

/**
 * Trigger function for Google Form submission
 */
function onFormSubmit(e) {
  try {
    const responses = e.namedValues;
    const customerName = responses['Customer Name'][0];
    const customerEmail = responses['Customer Email'][0];
    const customerPhone = responses['Customer Phone Number'][0];
    const productName = responses['Product Name'][0];
    const quantity = parseFloat(responses['Quantity'][0]);
    const pricePerUnit = parseFloat(responses['Price per Unit'][0]);
    const paymentMode = responses['Payment Mode'][0];
    const paymentStatus = responses['Payment Status'][0];
    const date = responses['Timestamp'][0] || new Date().toLocaleString();

    // 1. Calculations
    const subtotal = quantity * pricePerUnit;
    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount;
    const invoiceId = "INV-" + Math.floor(Math.random() * 1000000);

    // 2. Prepare Data for PDF
    const data = {
      invoiceId,
      customerName,
      customerEmail,
      customerPhone,
      productName,
      quantity,
      pricePerUnit,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      paymentMode,
      paymentStatus,
      date,
      shopName: SHOP_NAME,
      shopAddress: SHOP_ADDRESS,
      shopContact: SHOP_CONTACT
    };

    // 3. Generate PDF
    const pdfBlob = createInvoicePDF(data);

    // 4. Send Email
    sendInvoiceEmail(customerEmail, customerName, pdfBlob, invoiceId);

    // 5. Update Sheet with Invoice ID and Total
    updateSheetWithInvoiceData(invoiceId, totalAmount);

    // 6. Sync with MySQL Backend
    syncWithMySQL(data);

  } catch (error) {
    Logger.log("Error processing form submission: " + error.toString());
  }
}

/**
 * Sends data to the Node.js / MySQL backend
 */
function syncWithMySQL(data) {
  const backendUrl = "REPLACE_WITH_YOUR_BACKEND_URL/api/invoices"; // e.g. https://your-ngrok-url.ngrok-free.app/api/invoices
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(backendUrl, options);
    Logger.log("MySQL Sync Response: " + response.getContentText());
  } catch (e) {
    Logger.log("MySQL Sync Failed: " + e.toString());
  }
}

/**
 * Creates a PDF blob from an HTML template
 */
function createInvoicePDF(data) {
  const template = HtmlService.createTemplateFromFile('InvoiceTemplate');
  template.data = data;
  const htmlContent = template.evaluate().getContent();
  
  // Create PDF
  const blob = Utilities.newBlob(htmlContent, 'text/html', 'invoice.html');
  const pdf = blob.getAs('application/pdf');
  pdf.setName(`${data.invoiceId}_${data.customerName}.pdf`);
  
  return pdf;
}

/**
 * Emails the PDF to the customer
 */
function sendInvoiceEmail(email, name, pdfBlob, invoiceId) {
  const subject = `Your Invoice from ${SHOP_NAME} - #${invoiceId}`;
  const body = `Dear ${name},\n\nThank you for your purchase! Please find your invoice attached.\n\nTotal Details:\nInvoice ID: ${invoiceId}\n\nBest Regards,\n${SHOP_NAME}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Thank you for your order, ${name}!</h2>
      <p>We appreciate your business. Your invoice <b>#${invoiceId}</b> is attached to this email.</p>
      <br>
      <p>Best Regards,<br><b>${SHOP_NAME} team</b></p>
    </div>
  `;

  GmailApp.sendEmail(email, subject, body, {
    htmlBody: htmlBody,
    attachments: [pdfBlob]
  });
}

/**
 * Updates the spreadsheet with the generated Invoice ID
 */
function updateSheetWithInvoiceData(invoiceId, totalAmount) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  // Assuming we want to add columns for Invoice ID and Total if they don't exist
  // We'll append them to the end of the row
  sheet.getRange(lastRow, sheet.getLastColumn() + 1).setValue(invoiceId);
  sheet.getRange(lastRow, sheet.getLastColumn() + 1).setValue(totalAmount);
}
