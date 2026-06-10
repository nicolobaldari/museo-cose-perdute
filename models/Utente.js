/**
 * Modello Sequelize per gli Utenti.
 * Gestisce i dati anagrafici e di autenticazione, garantendo l'unicità degli account e la validazione strutturale dell'email.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Utente = sequelize.define('Utente', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'utenti',
    timestamps: true
});

module.exports = Utente;