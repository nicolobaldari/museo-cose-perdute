/**
 * Modello Sequelize per le Segnalazioni.
 * Rappresenta il nucleo centrale dell'applicazione, archiviando sia gli oggetti smarriti che quelli ritrovati.
 * Gestisce le validazioni dei dati di input e il ciclo di vita dell'annuncio tramite il campo 'stato'.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Segnalazione = sequelize.define('Segnalazione', {
    tipo: {
        type: DataTypes.ENUM('smarrito', 'ritrovato'),
        allowNull: false
    },
    titolo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Il titolo non può essere vuoto" },
            len: { args: [3, 100], msg: "Il titolo deve essere lungo tra i 3 e i 100 caratteri" }
        }
    },
    descrizione: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "La descrizione è obbligatoria" }
        }
    },
    luogo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Il luogo è obbligatorio" }
        }
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "La categoria è obbligatoria" }
        }
    },
    data_evento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "Inserisci una data valida" }
        }
    },
    stato: {
        type: DataTypes.ENUM('aperta', 'in_verifica', 'risolta', 'archiviata'),
        defaultValue: 'aperta'
    },
    domanda_verifica: {
        type: DataTypes.STRING,
        allowNull: true
    },
}, {
    tableName: 'segnalazioni',
    timestamps: true
});

module.exports = Segnalazione;