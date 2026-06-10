/*
 * Questo file stabilisce la connessione al database MySQL utilizzando l'ORM Sequelize.
 * Configura i parametri base di accesso (nome db, utente, password, host) necessari
 * per far comunicare l'applicazione backend con il database locale.
 */
const { Sequelize } = require('sequelize');
// Inizializza l'istanza di Sequelize con le credenziali del DB MySQL e disabilita i log delle query
const sequelize = new Sequelize('museo_cose_perdute', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;