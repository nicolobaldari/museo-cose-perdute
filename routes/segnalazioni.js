/*
 * Questo file gestisce le API (CRUD) per le segnalazioni di oggetti smarriti e ritrovati.
 * Include il recupero dei dati con filtri di ricerca e la creazione di nuove segnalazioni.
 */
const express = require('express');
const { Op } = require('sequelize');
const { Segnalazione, Match } = require('../models/index');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Crea una nuova segnalazione nel database
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { tipo, titolo, descrizione, luogo, data_evento, categoria, domanda_verifica } = req.body;

        const nuovaSegnalazione = await Segnalazione.create({
            tipo,
            titolo,
            descrizione,
            luogo,
            data_evento,
            categoria,
            domanda_verifica: tipo === 'ritrovato' ? domanda_verifica : null,
            id_utente: req.user.id
        });

        res.status(201).json({ messaggio: "Segnalazione creata!", segnalazione: nuovaSegnalazione });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ errore: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ errore: "Errore durante la creazione della segnalazione" });
    }
});

// Recupera la bacheca pubblica delle segnalazioni, applicando eventuali filtri (tipo, categoria, luogo) richiesti dal frontend
router.get('/', async (req, res) => {
    try {
        const { tipo, categoria, luogo } = req.query;

        let filtri = {};
        if (tipo) filtri.tipo = tipo;
        if (categoria) filtri.categoria = categoria;
        if (luogo) filtri.luogo = luogo;

        const elenco = await Segnalazione.findAll({
            where: filtri,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(elenco);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nel recupero delle segnalazioni" });
    }
});

// Restituisce esclusivamente l'elenco delle segnalazioni create dall'utente attualmente loggato (per l'area "Le Mie Segnalazioni")
router.get('/utente/mie', authMiddleware, async (req, res) => {
    try {
        const elencoPersonale = await Segnalazione.findAll({
            where: { id_utente: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(elencoPersonale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nel recupero delle tue segnalazioni" });
    }
});

// Recupera i dettagli di una specifica segnalazione e controlla se l'utente ha già richiesto un match per quell'oggetto
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const objeto = await Segnalazione.findByPk(id);

        if (!objeto) {
            return res.status(404).json({ errore: "Oggetto non trovato" });
        }

        const isMio = objeto.id_utente === req.user.id;

        let haRichiestoMatch = false;
        if (!isMio && objeto.tipo === 'ritrovato') {
            const matchEsistente = await Match.findOne({
                where: {
                    id_segnalazione_ritrovato: id,
                    id_utente_proponente: req.user.id
                }
            });
            if (matchEsistente) {
                haRichiestoMatch = true;
            }
        }

        res.status(200).json({
            isMio,
            utenteLoggatoId: req.user.id,
            oggetto: objeto,
            haRichiestoMatch
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nel recupero del dettaglio" });
    }
});

// Permette al proprietario di una segnalazione di eliminarla definitivamente dal database
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const segnalazione = await Segnalazione.findByPk(req.params.id);
        if (!segnalazione || segnalazione.id_utente !== req.user.id) {
            return res.status(403).json({ errore: "Non autorizzato o oggetto non trovato" });
        }
        await segnalazione.destroy();
        res.status(200).json({ messaggio: "Oggetto eliminato correttamente" });
    } catch (error) {
        res.status(500).json({ errore: "Errore durante l'eliminazione" });
    }
});

module.exports = router;