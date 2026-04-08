const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const html_to_pdf = require('html-pdf-node');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Database Connection (MySQL)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

// Models
const Customer = sequelize.define('Customer', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING },
    totalSpent: { type: DataTypes.FLOAT, defaultValue: 0 }
});

const Invoice = sequelize.define('Invoice', {
    invoiceId: { type: DataTypes.STRING, unique: true },
    customerEmail: { type: DataTypes.STRING },
    productName: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER },
    pricePerUnit: { type: DataTypes.FLOAT },
    capital: { type: DataTypes.FLOAT, defaultValue: 0 },
    profit: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalAmount: { type: DataTypes.FLOAT },
    paymentMode: { type: DataTypes.STRING },
    paymentStatus: { type: DataTypes.STRING }
});

// Associations
Invoice.belongsTo(Customer, { foreignKey: 'customerEmail', targetKey: 'email' });
Customer.hasMany(Invoice, { foreignKey: 'customerEmail', sourceKey: 'email' });

// Test Connection and Sync
sequelize.authenticate()
    .then(() => {
        console.log('✅ Connected to MySQL Database successfully');
        return sequelize.sync({ alter: true });
    })
    .catch(err => console.error('❌ MySQL Connection Failed:', err.message));

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const fs = require('fs');
const path = require('path');

const generateHTML = (data) => {
    // Automatically find local logo and Base64 embed it for pure PDF generation portability
    const pngPath = path.join(__dirname, 'logo.png');
    const jpgPath = path.join(__dirname, 'logo.jpg');
    const jpegPath = path.join(__dirname, 'realfarm.jpeg');
    let logoSrc = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // fully isolated blank pixel
    try {
        if (fs.existsSync(jpegPath)) {
            logoSrc = `data:image/jpeg;base64,${fs.readFileSync(jpegPath).toString('base64')}`;
        } else if (fs.existsSync(pngPath)) {
            logoSrc = `data:image/png;base64,${fs.readFileSync(pngPath).toString('base64')}`;
        } else if (fs.existsSync(jpgPath)) {
            logoSrc = `data:image/jpeg;base64,${fs.readFileSync(jpgPath).toString('base64')}`;
        }
    } catch(e) {}

    const paymentStatusColor = data.paymentStatus === 'Paid' ? '#16a34a' : '#d97706';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #000000; background-color: #ffffff; margin: 0; }
    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #ccc; padding: 50px; background: white; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000000; padding-bottom: 20px; margin-bottom: 30px; }
    .logo img { max-width: 160px; height: auto; }
    .company-details { text-align: right; }
    .company-details h1 { color: #000000; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; }
    .company-details p { margin: 4px 0; color: #000000; font-size: 14px; }
    .billing-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .bill-to, .invoice-info { width: 45%; }
    .bill-to h3, .invoice-info h3 { color: #000000; border-bottom: 1px solid #000000; padding-bottom: 8px; margin-bottom: 12px; font-size: 16px; text-transform: uppercase; }
    .info-text { font-size: 14px; line-height: 1.6; color: #000000; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    table.items th { background-color: #f3f4f6; color: #000000; padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid #000000; }
    table.items td { padding: 15px; border-bottom: 1px solid #ccc; color: #000000; font-size: 15px; }
    .totals-row { display: flex; justify-content: flex-end; }
    .totals-table { width: 300px; border-collapse: collapse; }
    .totals-table th, .totals-table td { border: none; padding: 10px 15px; color: #000000; }
    .totals-table tr:last-child th, .totals-table tr:last-child td { border-top: 2px solid #000000; font-size: 20px; font-weight: 800; color: #000000; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; color: #000000; font-size: 13px; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div class="logo">
        <img src="${logoSrc}" alt="Real Farms Logo">
      </div>
      <div class="company-details">
        <h1>REAL FARMS</h1>
        <p>Premium Agricultural Products</p>
        <p>Maharashtra, India</p>
      </div>
    </div>
    <div class="billing-row">
      <div class="bill-to info-text">
        <h3>Billed To</h3>
        <strong style="color: #1f2937; font-size: 16px;">${data.customerName || ''}</strong><br>
        ${data.customerPhone || ''}<br>
        ${data.customerEmail || ''}
      </div>
      <div class="invoice-info info-text">
        <h3>Invoice Details</h3>
        <strong>Invoice No:</strong> ${data.invoiceId || ''}<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>Status:</strong> <span style="text-transform: uppercase; font-weight:bold; color: ${paymentStatusColor};">${data.paymentStatus || ''}</span><br>
        <strong>Mode:</strong> ${data.paymentMode || ''}
      </div>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold; color: #1e3a8a;">${data.productName || ''}</td>
          <td style="text-align: center;">${data.quantity || ''}</td>
          <td style="text-align: right;">₹${Number(data.pricePerUnit).toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold; color: #1f2937;">₹${data.totalAmount || ''}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals-row">
      <table class="totals-table">
        <tr>
          <th style="text-align: left; color:#6b7280;">Subtotal</th>
          <td style="text-align: right; color:#6b7280;">₹${data.totalAmount || ''}</td>
        </tr>
        <tr>
          <th style="text-align: left;">Grand Total</th>
          <td style="text-align: right;">₹${data.totalAmount || ''}</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <p>Thank you for doing business with Real Farms. We appreciate your trust in our quality products!</p>
    </div>
  </div>
</body>
</html>
`;
};

app.post('/api/invoices', async (req, res) => {
    const { 
        customerName, customerEmail, customerPhone, 
        productName, quantity, pricePerUnit, capital, paymentMode, paymentStatus 
    } = req.body;

    const firstFour = customerName.substring(0, 4).toUpperCase();
    const lastThree = customerPhone.substring(customerPhone.length - 3);
    const invoiceId = `INV${firstFour}${lastThree}`;
    
    const subtotal = quantity * pricePerUnit;
    const profit = (pricePerUnit - capital) * quantity;
    const totalAmount = subtotal.toFixed(2);

    const invoiceData = { ...req.body, invoiceId, totalAmount };

    try {
        let customer = await Customer.findOne({ where: { email: customerEmail } });
        if (customer) {
            customer.totalSpent += parseFloat(totalAmount);
            await customer.save();
        } else {
            await Customer.create({ name: customerName, email: customerEmail, phone: customerPhone, totalSpent: totalAmount });
        }

        await Invoice.create({
            invoiceId, customerEmail, productName, quantity, 
            pricePerUnit: parseFloat(pricePerUnit), 
            capital: parseFloat(capital),
            profit: parseFloat(profit),
            totalAmount: parseFloat(totalAmount), 
            paymentMode, paymentStatus
        });

        const options = { format: 'A4' };
        const file = { content: generateHTML(invoiceData) };
        const pdfBuffer = await html_to_pdf.generatePdf(file, options);

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: customerEmail,
                subject: `Your Invoice #${invoiceId} from MODERN SHOP`,
                html: `<p>Dear ${customerName},</p><p>Thank you for your purchase. Please find your invoice attached.</p>`,
                attachments: [{ filename: `Invoice_${invoiceId}.pdf`, content: pdfBuffer }]
            };
            await transporter.sendMail(mailOptions).catch(e => console.error('Email failed:', e.message));
        }

        // 5. Sync to Google Sheets
        if (process.env.GOOGLE_SCRIPT_URL) {
            axios.post(process.env.GOOGLE_SCRIPT_URL, invoiceData).catch(e => console.error('Sheets Sync Failed:', e.message));
        }

        res.json({ success: true, invoiceId });
    } catch (err) {
        console.error('API Error:', err.message);
        res.status(500).json({ error: 'Failed to process invoice', details: err.message });
    }
});

app.get('/api/invoices', async (req, res) => {
    const invoices = await Invoice.findAll({ 
        include: [{ model: Customer, attributes: ['name', 'phone'] }],
        order: [['createdAt', 'DESC']] 
    });
    res.json(invoices);
});

app.put('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, customerEmail, customerPhone, paymentStatus, paymentMode, productName, quantity, pricePerUnit, capital } = req.body;
        
        const invoice = await Invoice.findOne({ where: { invoiceId: id } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        // Upsert customer details (creates new profile if email changed, otherwise simply updates)
        if (customerEmail) {
            await Customer.upsert({
                email: customerEmail,
                name: customerName,
                phone: customerPhone
            });
        }

        const subtotal = quantity * pricePerUnit;
        const profit = (pricePerUnit - capital) * quantity;
        const totalAmount = subtotal.toFixed(2);

        await invoice.update({ 
            customerEmail: customerEmail || invoice.customerEmail,
            paymentStatus, paymentMode, productName, quantity, 
            pricePerUnit, capital, profit, totalAmount 
        });

        res.json({ success: true, message: 'Invoice updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', details: err.message });
    }
});

app.delete('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({ where: { invoiceId: id } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        
        await invoice.destroy();
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed', details: err.message });
    }
});

app.get('/api/invoices/:id/pdf', async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({ 
            where: { invoiceId: id },
            include: [{ model: Customer }] 
        });
        
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const invoiceData = {
            invoiceId: invoice.invoiceId,
            customerName: invoice.Customer?.name || 'Customer',
            customerEmail: invoice.customerEmail,
            customerPhone: invoice.Customer?.phone || '',
            productName: invoice.productName,
            quantity: invoice.quantity,
            pricePerUnit: invoice.pricePerUnit,
            totalAmount: invoice.totalAmount
        };

        const options = { format: 'A4' };
        const file = { content: generateHTML(invoiceData) };
        const pdfBuffer = await html_to_pdf.generatePdf(file, options);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${id}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
    }
});

app.post('/api/invoices/:id/email', async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({ 
            where: { invoiceId: id },
            include: [{ model: Customer }] 
        });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(400).json({ error: 'Email credentials not fully configured in your .env' });
        }

        const invoiceData = {
            invoiceId: invoice.invoiceId,
            customerName: invoice.Customer?.name || 'Customer',
            customerEmail: invoice.customerEmail,
            customerPhone: invoice.Customer?.phone || '',
            productName: invoice.productName,
            quantity: invoice.quantity,
            pricePerUnit: invoice.pricePerUnit,
            totalAmount: invoice.totalAmount
        };

        const options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
        const file = { content: generateHTML(invoiceData) };
        const pdfBuffer = await html_to_pdf.generatePdf(file, options);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: invoice.customerEmail,
            subject: `Your Invoice #${invoice.invoiceId} from MODERN SHOP`,
            html: `<p>Dear ${invoiceData.customerName},</p><p>Thank you for your purchase. Please find your official invoice attached.</p>`,
            attachments: [{ filename: `Invoice_${invoice.invoiceId}.pdf`, content: pdfBuffer }]
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully directly to the customer!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    const totalRevenue = await Invoice.sum('totalAmount') || 0;
    const totalOrders = await Invoice.count();
    const pendingAmount = await Invoice.sum('totalAmount', { where: { paymentStatus: 'Pending' } }) || 0;
    const totalProfit = await Invoice.sum('profit') || 0;
    res.json({ totalRevenue, totalOrders, pendingAmount, totalProfit });
});

app.listen(PORT, () => console.log(`🚀 Server fully connected on http://localhost:${PORT}`));
