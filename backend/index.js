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

const sequelize = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
    { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

const Customer = sequelize.define('Customer', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING },
    totalSpent: { type: DataTypes.FLOAT, defaultValue: 0 }
});

const Invoice = sequelize.define('Invoice', {
    invoiceId: { type: DataTypes.STRING, unique: true },
    customerEmail: { type: DataTypes.STRING },
    productName: { type: DataTypes.STRING },   // comma-separated summary
    quantity: { type: DataTypes.INTEGER },   // total qty
    pricePerUnit: { type: DataTypes.FLOAT },
    capital: { type: DataTypes.FLOAT, defaultValue: 0 },
    profit: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalAmount: { type: DataTypes.FLOAT },
    paymentMode: { type: DataTypes.STRING },
    paymentStatus: { type: DataTypes.STRING },
    items: { type: DataTypes.TEXT, defaultValue: null } // JSON array of line items
});

Invoice.belongsTo(Customer, { foreignKey: 'customerEmail', targetKey: 'email' });
Customer.hasMany(Invoice, { foreignKey: 'customerEmail', sourceKey: 'email' });

sequelize.authenticate()
    .then(() => { console.log('✅ Connected to MySQL Database successfully'); return sequelize.sync({ alter: true }); })
    .catch(err => console.error('❌ MySQL Connection Failed:', err.message));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const fs = require('fs');
const path = require('path');

// ── PDF HTML Generator ───────────────────────────────────────────────────────
const generateHTML = (data) => {
    const jpegPath = path.join(__dirname, 'realfarm.jpeg');
    const pngPath = path.join(__dirname, 'logo.png');
    const jpgPath = path.join(__dirname, 'logo.jpg');
    let logoSrc = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    try {
        if (fs.existsSync(jpegPath)) logoSrc = `data:image/jpeg;base64,${fs.readFileSync(jpegPath).toString('base64')}`;
        else if (fs.existsSync(pngPath)) logoSrc = `data:image/png;base64,${fs.readFileSync(pngPath).toString('base64')}`;
        else if (fs.existsSync(jpgPath)) logoSrc = `data:image/jpeg;base64,${fs.readFileSync(jpgPath).toString('base64')}`;
    } catch (e) { }

    // Resolve items — new array format OR legacy single product
    let items = [];
    if (data.items) {
        items = Array.isArray(data.items) ? data.items : JSON.parse(data.items);
    } else {
        items = [{ productName: data.productName, quantity: data.quantity, pricePerUnit: data.pricePerUnit }];
    }

    const itemRows = items.map((item, idx) => {
        const rowTotal = (Number(item.quantity) * Number(item.pricePerUnit)).toFixed(2);
        return `<tr style="${idx % 2 === 1 ? 'background:#f9fafb;' : ''}">
          <td style="font-weight:bold;color:#1e3a8a;padding:13px 15px;">${item.productName}</td>
          <td style="text-align:center;padding:13px 15px;">${item.quantity}</td>
          <td style="text-align:right;padding:13px 15px;">₹${Number(item.pricePerUnit).toFixed(2)}</td>
          <td style="text-align:right;font-weight:bold;color:#1f2937;padding:13px 15px;">₹${rowTotal}</td>
        </tr>`;
    }).join('');

    const statusColor = data.paymentStatus === 'Paid' ? '#16a34a' : '#d97706';

    return `<!DOCTYPE html><html><head><style>
    body{font-family:'Segoe UI',sans-serif;padding:40px;color:#000;background:#fff;margin:0;}
    .box{max-width:800px;margin:auto;border:1px solid #ccc;padding:50px;border-radius:12px;}
    .hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #000;padding-bottom:20px;margin-bottom:30px;}
    .logo img{max-width:160px;height:auto;}
    .co{text-align:right;}
    .co h1{color:#000;margin:0;font-size:28px;text-transform:uppercase;letter-spacing:1px;font-weight:900;}
    .co p{margin:4px 0;font-size:14px;}
    .billing{display:flex;justify-content:space-between;margin-bottom:40px;}
    .bill-to,.inv-info{width:45%;}
    .bill-to h3,.inv-info h3{border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:12px;font-size:16px;text-transform:uppercase;}
    .info{font-size:14px;line-height:1.7;}
    table.items{width:100%;border-collapse:collapse;margin-bottom:40px;}
    table.items th{background:#f3f4f6;padding:12px 15px;text-align:left;font-weight:600;border-bottom:2px solid #000;}
    table.items td{border-bottom:1px solid #e5e7eb;font-size:15px;}
    .totals{display:flex;justify-content:flex-end;}
    .totals-tbl{width:300px;border-collapse:collapse;}
    .totals-tbl th,.totals-tbl td{padding:10px 15px;}
    .totals-tbl tr:last-child th,.totals-tbl tr:last-child td{border-top:2px solid #000;font-size:20px;font-weight:800;}
    .footer{text-align:center;margin-top:50px;padding-top:20px;border-top:1px solid #ccc;font-size:13px;}
    </style></head><body>
    <div class="box">
      <div class="hdr">
        <div class="logo"><img src="${logoSrc}" alt="Real Farms"></div>
        <div class="co"><h1>REAL FARMS</h1><p>Premium Agricultural Products</p><p>Maharashtra, India</p></div>
      </div>
      <div class="billing">
        <div class="bill-to info"><h3>Billed To</h3>
          <strong style="font-size:16px;">${data.customerName || ''}</strong><br>
          ${data.customerPhone || ''}<br>${data.customerEmail || ''}
        </div>
        <div class="inv-info info"><h3>Invoice Details</h3>
          <strong>Invoice No:</strong> ${data.invoiceId || ''}<br>
          <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Status:</strong> <span style="text-transform:uppercase;font-weight:bold;color:${statusColor};">${data.paymentStatus || ''}</span><br>
          <strong>Mode:</strong> ${data.paymentMode || ''}
        </div>
      </div>
      <table class="items">
        <thead><tr>
          <th>Item Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Amount</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="totals">
        <table class="totals-tbl">
          <tr><th style="text-align:left;color:#6b7280;">Subtotal</th><td style="text-align:right;color:#6b7280;">₹${data.totalAmount || ''}</td></tr>
          <tr><th style="text-align:left;">Grand Total</th><td style="text-align:right;">₹${data.totalAmount || ''}</td></tr>
        </table>
      </div>
      <div class="footer"><p>Thank you for doing business with Real Farms. We appreciate your trust in our quality products!</p></div>
    </div>
    </body></html>`;
};

// Helper — parse items from request body (new multi-item or legacy single)
const resolveItems = (body) => {
    if (body.items && body.items.length) return body.items;
    return [{ productName: body.productName, quantity: body.quantity, pricePerUnit: body.pricePerUnit, capital: body.capital }];
};

// ── POST /api/invoices ───────────────────────────────────────────────────────
app.post('/api/invoices', async (req, res) => {
    const { customerName, customerEmail, customerPhone, paymentMode, paymentStatus } = req.body;
    const invoiceItems = resolveItems(req.body);

    const totalAmount = invoiceItems.reduce((s, i) => s + Number(i.quantity) * Number(i.pricePerUnit), 0);
    const totalProfit = invoiceItems.reduce((s, i) => s + Number(i.quantity) * (Number(i.pricePerUnit) - Number(i.capital)), 0);
    const productSummary = invoiceItems.map(i => i.productName).join(', ');
    const totalQty = invoiceItems.reduce((s, i) => s + Number(i.quantity), 0);

    const firstFour = customerName.substring(0, 4).toUpperCase();
    const lastThree = customerPhone.slice(-3);
    const invoiceId = `INV${firstFour}${lastThree}`;

    const invoiceData = { customerName, customerEmail, customerPhone, items: invoiceItems, invoiceId, totalAmount: totalAmount.toFixed(2), paymentMode, paymentStatus };

    try {
        let customer = await Customer.findOne({ where: { email: customerEmail } });
        if (customer) { customer.totalSpent += totalAmount; await customer.save(); }
        else await Customer.create({ name: customerName, email: customerEmail, phone: customerPhone, totalSpent: totalAmount });

        await Invoice.create({
            invoiceId, customerEmail,
            productName: productSummary,
            quantity: totalQty,
            pricePerUnit: parseFloat(invoiceItems[0].pricePerUnit),
            capital: parseFloat(invoiceItems[0].capital),
            profit: parseFloat(totalProfit.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            paymentMode, paymentStatus,
            items: JSON.stringify(invoiceItems)
        });

        const pdfBuffer = await html_to_pdf.generatePdf({ content: generateHTML(invoiceData) }, { format: 'A4' });

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER, to: customerEmail,
                subject: `Your Invoice #${invoiceId} from Real Farms`,
                html: `<p>Dear ${customerName},</p><p>Thank you! Please find your invoice attached.</p>`,
                attachments: [{ filename: `Invoice_${invoiceId}.pdf`, content: pdfBuffer }]
            }).catch(e => console.error('Email failed:', e.message));
        }

        if (process.env.GOOGLE_SCRIPT_URL) {
            axios.post(process.env.GOOGLE_SCRIPT_URL, invoiceData).catch(e => console.error('Sheets Sync Failed:', e.message));
        }

        res.json({ success: true, invoiceId });
    } catch (err) {
        console.error('API Error:', err.message);
        res.status(500).json({ error: 'Failed to process invoice', details: err.message });
    }
});

// ── GET /api/invoices ────────────────────────────────────────────────────────
app.get('/api/invoices', async (req, res) => {
    const invoices = await Invoice.findAll({
        include: [{ model: Customer, attributes: ['name', 'phone'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
});

// ── PUT /api/invoices/:id ────────────────────────────────────────────────────
app.put('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, customerEmail, customerPhone, paymentStatus, paymentMode } = req.body;
        const invoice = await Invoice.findOne({ where: { invoiceId: id } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        if (customerEmail) await Customer.upsert({ email: customerEmail, name: customerName, phone: customerPhone });

        const invoiceItems = resolveItems(req.body);
        const totalAmount = invoiceItems.reduce((s, i) => s + Number(i.quantity) * Number(i.pricePerUnit), 0);
        const totalProfit = invoiceItems.reduce((s, i) => s + Number(i.quantity) * (Number(i.pricePerUnit) - Number(i.capital)), 0);

        await invoice.update({
            customerEmail: customerEmail || invoice.customerEmail,
            productName: invoiceItems.map(i => i.productName).join(', '),
            quantity: invoiceItems.reduce((s, i) => s + Number(i.quantity), 0),
            pricePerUnit: parseFloat(invoiceItems[0].pricePerUnit),
            capital: parseFloat(invoiceItems[0].capital),
            profit: parseFloat(totalProfit.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            paymentStatus, paymentMode,
            items: JSON.stringify(invoiceItems)
        });

        res.json({ success: true, message: 'Invoice updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', details: err.message });
    }
});

// ── DELETE /api/invoices/:id ─────────────────────────────────────────────────
app.delete('/api/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ where: { invoiceId: req.params.id } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        await invoice.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed', details: err.message });
    }
});

// ── POST /api/invoices/:id/email ─────────────────────────────────────────────
app.post('/api/invoices/:id/email', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ where: { invoiceId: req.params.id }, include: [{ model: Customer }] });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
            return res.status(400).json({ error: 'Email credentials not configured in .env' });

        const invoiceData = {
            invoiceId: invoice.invoiceId,
            customerName: invoice.Customer?.name || 'Customer',
            customerEmail: invoice.customerEmail,
            customerPhone: invoice.Customer?.phone || '',
            items: invoice.items,
            productName: invoice.productName,
            quantity: invoice.quantity,
            pricePerUnit: invoice.pricePerUnit,
            totalAmount: invoice.totalAmount,
            paymentStatus: invoice.paymentStatus,
            paymentMode: invoice.paymentMode
        };

        const pdfBuffer = await html_to_pdf.generatePdf(
            { content: generateHTML(invoiceData) },
            { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] }
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER, to: invoice.customerEmail,
            subject: `Your Invoice #${invoice.invoiceId} from Real Farms`,
            html: `<p>Dear ${invoiceData.customerName},</p><p>Please find your official invoice attached.</p>`,
            attachments: [{ filename: `Invoice_${invoice.invoiceId}.pdf`, content: pdfBuffer }]
        });

        res.json({ success: true, message: 'Email sent successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
});

// ── GET /api/stats ───────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
    const totalRevenue = await Invoice.sum('totalAmount') || 0;
    const totalOrders = await Invoice.count();
    const pendingAmount = await Invoice.sum('totalAmount', { where: { paymentStatus: 'Pending' } }) || 0;
    const totalProfit = await Invoice.sum('profit') || 0;
    res.json({ totalRevenue, totalOrders, pendingAmount, totalProfit });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const validUser = process.env.ADMIN_USER || 'admin';
    const validPass = process.env.ADMIN_PASS || 'RealFarms@2026';

    if (username === validUser && password === validPass) {
        // Simple session token (username+timestamp hash)
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.listen(PORT, () => console.log(`🚀 Server fully connected on http://localhost:${PORT}`));
