/**
 * Modello Sequelize per i Messaggi.
 * Gestisce la struttura della chat interna tra gli utenti per organizzare la restituzione degli oggetti.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Messaggio = sequelize.define('Messaggio', {
    contenuto: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Il messaggio non può essere vuoto" }
        }
    },
    letto: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'messaggi',
    timestamps: true
});

module.exports = Messaggio;