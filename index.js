/*
 * Entry point principale del server backend Node.js per l'applicazione.
 * Inizializza Express e definisce il routing delle API sincronizzando contestualmente il database.
 */
const express = require('express');
const sequelize = require('./database');
const { Utente, Segnalazione, Messaggio, Match } = require('./models/index');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Importa e registra i vari moduli di routing per organizzare gli endpoint dell'API REST
const segnalazioniRoutes = require('./routes/segnalazioni');
const authRoutes = require('./routes/auth');
const messaggiRoutes = require('./routes/messaggi');
const matchRoutes = require('./routes/match');

app.use('/api/segnalazioni', segnalazioniRoutes);
app.use('/api/messaggi', messaggiRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/auth', authRoutes);

// Sincronizza i modelli di Sequelize con il database MySQL (creando o aggiornando le tabelle in automatico)
sequelize.sync({ alter: true })
    .then(() => console.log(" Database sincronizzato!"))
    .catch((err) => console.error(" Errore DB:", err));

app.get('/', (req, res) => {
    res.send("Il backend del Museo delle Cose Perdute è attivo!");
});

// Avvia il server HTTP sulla porta 3000, mettendolo in ascolto su tutte le interfacce di rete
app.listen(3000, '0.0.0.0', () => {
    console.log(" Server avviato su http://0.0.0.0:3000");
});