/*
 * Questo file gestisce le rotte API per l'autenticazione degli utenti (registrazione e login).
 * Utilizza bcrypt per criptare le password in modo sicuro e jsonwebtoken (JWT) per
 * generare e rilasciare i token di sessione validi.
 */
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Utente } = require('../models/index');

const router = express.Router();
// Endpoint per la registrazione: verifica se l'email esiste già, esegue l'hashing della password e salva l'utente nel DB
router.post('/register', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        const utenteEsistente = await Utente.findOne({ where: { email: email } });
        if (utenteEsistente) {
            return res.status(400).json({ errore: "Email già registrata" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const nuovoUtente = await Utente.create({
            nome: nome,
            email: email,
            password_hash: passwordHash
        });

        res.status(201).json({ messaggio: "Utente registrato con successo!", id: nuovoUtente.id });

    } catch (errore) {
        if (errore.name === 'SequelizeValidationError') {
            return res.status(400).json({ errore: "L'indirizzo email inserito non è valido." });
        }

        console.error(errore);
        res.status(500).json({ errore: "Errore interno del server" });
    }
});
// Endpoint per il login: verifica email e password, se corrette genera e restituisce un token JWT (valido 2 ore)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const utente = await Utente.findOne({ where: { email: email } });
        if (!utente) {
            return res.status(401).json({ errore: "Credenziali non valide" });
        }

        const passwordCorretta = await bcrypt.compare(password, utente.password_hash);
        if (!passwordCorretta) {
            return res.status(401).json({ errore: "Credenziali non valide" });
        }

        const token = jwt.sign(
            {
                id: utente.id,
                email: utente.email,
                nome: utente.nome
            },
            "CHIAVE_SEGRETA_SUPER_SICURA_TIW",
            { expiresIn: '2h' }
        );

        res.status(200).json({
            messaggio: "Login effettuato",
            token: token
        });

    } catch (errore) {
        console.error(errore);
        res.status(500).json({ errore: "Errore interno del server" });
    }
});

module.exports = router;