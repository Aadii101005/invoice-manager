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

async function check() {
    try {
        await sequelize.authenticate();
        const customers = await Customer.findAll();
        console.log(customers.map(c => ({ name: c.name, email: c.email })));
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await sequelize.close();
    }
}

check();
