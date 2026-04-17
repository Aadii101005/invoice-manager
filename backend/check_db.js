const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
    { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

const Invoice = sequelize.define('Invoice', {
    invoiceId: { type: DataTypes.STRING, unique: true },
});

async function check() {
    try {
        await sequelize.authenticate();
        const count = await Invoice.count();
        console.log('Invoice count:', count);
        const invoices = await Invoice.findAll({ limit: 5 });
        console.log('Sample invoice IDs:', invoices.map(i => i.invoiceId));
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await sequelize.close();
    }
}

check();
