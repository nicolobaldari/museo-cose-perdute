
/**
 * Modello Sequelize per i Match (Proposte di restituzione).
 * Rappresenta il collegamento tra un oggetto smarrito e uno ritrovato, tenendo traccia della risposta di verifica e dello stato di approvazione.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Definizione dello schema: riferimenti agli oggetti coinvolti, all'utente che fa la richiesta e ai dati della proposta
const Match = sequelize.define('Match', {
    id_segnalazione_smarrito: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_segnalazione_ritrovato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_utente_proponente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    risposta_utente: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Il match nasce sempre "in_attesa" finché il proprietario dell'oggetto ritrovato non lo approva o rifiuta
    stato: {
        type: DataTypes.ENUM('in_attesa', 'approvato', 'rifiutato'),
        defaultValue: 'in_attesa'
    }
}, {
    tableName: 'match_proposte',
    timestamps: true
});

module.exports = Match;