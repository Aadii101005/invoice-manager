const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
    { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

const Customer = sequelize.define('Customer', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
});

const Invoice = sequelize.define('Invoice', {
    invoiceId: { type: DataTypes.STRING, unique: true },
    customerEmail: { type: DataTypes.STRING },
});

async function check() {
    try {
        await sequelize.authenticate();
        const invoices = await Invoice.findAll();
        for (const inv of invoices) {
            const cust = await Customer.findOne({ where: { email: inv.customerEmail } });
            console.log(`ID: ${inv.invoiceId}, Customer: ${cust ? cust.name : 'Unknown'}`);
        }
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await sequelize.close();
    }
}

check();
