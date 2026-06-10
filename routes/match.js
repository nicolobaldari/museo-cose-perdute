/*
 * Questo file gestisce le rotte API per le operazioni di "Match" tra oggetti smarriti e ritrovati.
 * Si occupa di creare nuove proposte di restituzione e gestire l'accettazione o il rifiuto da parte
 * degli utenti aggiornando i relativi stati nel database.
 */
const express = require('express');
const { Op } = require('sequelize');
const { Match, Segnalazione, Utente } = require('../models/index');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Crea una nuova proposta di match: collega un oggetto smarrito a uno ritrovato e imposta lo stato in "in_verifica"
router.post('/:id_segnalazione_ritrovato', authMiddleware, async (req, res) => {
    try {
        const { id_segnalazione_ritrovato } = req.params;
        const { id_smarrito, risposta } = req.body;

        const segRitrovata = await Segnalazione.findByPk(id_segnalazione_ritrovato);
        const segSmarrita = await Segnalazione.findByPk(id_smarrito);

        if (!segRitrovata || !segSmarrita) return res.status(404).json({ errore: "Segnalazioni non trovate" });

        const nuovoMatch = await Match.create({
            id_segnalazione_smarrito: id_smarrito,
            id_segnalazione_ritrovato: id_segnalazione_ritrovato,
            id_utente_proponente: req.user.id,
            risposta_utente: risposta
        });

        await segRitrovata.update({ stato: 'in_verifica' });
        await segSmarrita.update({ stato: 'in_verifica' });

        res.status(201).json({ messaggio: "Proposta inviata!", dati: nuovoMatch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore durante l'invio della proposta" });
    }
});

// Permette al proprietario del ritrovamento di approvare o rifiutare un match, aggiornando gli stati
router.patch('/:id/stato', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nuovoStato } = req.body;

        const match = await Match.findByPk(id, {
            include: [
                { model: Segnalazione, as: 'SegnalazioneRitrovata' },
                { model: Segnalazione, as: 'SegnalazioneSmarrita' }
            ]
        });

        if (!match) return res.status(404).json({ errore: "Match non trovato" });

        if (match.SegnalazioneRitrovata.id_utente !== req.user.id) {
            return res.status(403).json({ errore: "Non autorizzato" });
        }

        match.stato = nuovoStato;
        await match.save();

        if (nuovoStato === 'approvato') {
            await match.SegnalazioneRitrovata.update({ stato: 'risolta' });
            await match.SegnalazioneSmarrita.update({ stato: 'risolta' });
        } else {
            await match.SegnalazioneRitrovata.update({ stato: 'aperta' });
            await match.SegnalazioneSmarrita.update({ stato: 'aperta' });
        }

        res.status(200).json({ messaggio: `Stato aggiornato a ${nuovoStato}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore aggiornamento stato" });
    }
});

// Recupera dal database tutte le proposte (match) ricevute per uno specifico oggetto ritrovato
router.get('/ricevute/:id_segnalazione', authMiddleware, async (req, res) => {
    try {
        const matchRicevuti = await Match.findAll({
            where: { id_segnalazione_ritrovato: req.params.id_segnalazione },
            include: [{ model: Utente, as: 'Proponente', attributes: ['nome', 'email'] }]
        });
        res.status(200).json(matchRicevuti);
    } catch (error) {
        res.status(500).json({ errore: "Errore nel recupero" });
    }
});

// Genera suggerimenti automatici cercando nel DB oggetti ritrovati che appartengono alla stessa categoria dell'oggetto smarrito
router.get('/suggerimenti/:id_segnalazione', authMiddleware, async (req, res) => {
    try {
        const { id_segnalazione } = req.params;
        const smarrito = await Segnalazione.findByPk(id_segnalazione);
        if (!smarrito || smarrito.id_utente !== req.user.id) {
            return res.status(403).json({ errore: "Non autorizzato" });
        }

        const suggeriti = await Segnalazione.findAll({
            where: {
                tipo: 'ritrovato',
                stato: 'aperta',
                categoria: smarrito.categoria,
                id_utente: { [Op.ne]: req.user.id }
            },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(suggeriti);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore recupero suggerimenti" });
    }
});

module.exports = router;