const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
    { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

async function check() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("DESCRIBE Invoices");
        console.log(results);
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await sequelize.close();
    }
}

check();
