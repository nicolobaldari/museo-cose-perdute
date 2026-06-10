/*
 * Questo file gestisce le richieste di contatto (messaggi) tra utenti.
 * Permette di inviare un messaggio al proprietario di un oggetto, di recuperare
 * tutti i messaggi ricevuti e di gestire la chat diretta nei match approvati.
 */
const express = require('express');
const { Op } = require('sequelize');
const { Messaggio, Segnalazione, Utente, Match } = require('../models/index');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Salva un nuovo messaggio inviato all'autore di una segnalazione
router.post('/:id_segnalazione', authMiddleware, async (req, res) => {
    try {
        const { id_segnalazione } = req.params;
        const { contenuto } = req.body;

        const segnalazione = await Segnalazione.findByPk(id_segnalazione);
        if (!segnalazione) return res.status(404).json({ errore: "Segnalazione non trovata" });

        if (segnalazione.id_utente === req.user.id) {
            return res.status(400).json({ errore: "Non puoi inviare un messaggio a te stesso" });
        }

        await Messaggio.create({
            contenuto,
            id_segnalazione,
            id_mittente: req.user.id,
            id_destinatario: segnalazione.id_utente,
            letto: false
        });

        res.status(201).json({ messaggio: "Messaggio inviato con successo!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nell'invio del messaggio" });
    }
});

// Recupera tutti i messaggi ricevuti per una specifica segnalazione (usato in Le Mie Segnalazioni)
router.get('/ricevuti/:id_segnalazione', authMiddleware, async (req, res) => {
    try {
        const { id_segnalazione } = req.params;

        const messaggi = await Messaggio.findAll({
            where: {
                id_segnalazione,
                id_destinatario: req.user.id
            },
            include: [
                { model: Utente, as: 'Mittente', attributes: ['email', 'nome'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(messaggi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nel recupero dei messaggi" });
    }
});

// Recupera l'intera conversazione tra i due utenti coinvolti in un match approvato
router.get('/chat/:id_segnalazione', authMiddleware, async (req, res) => {
    try {
        const { id_segnalazione } = req.params;
        const mioId = req.user.id;

        const matchApprovato = await Match.findOne({
            where: {
                [Op.or]: [
                    { id_segnalazione_ritrovato: id_segnalazione },
                    { id_segnalazione_smarrito: id_segnalazione }
                ],
                stato: 'approvato'
            }
        });

        if (!matchApprovato) {
            return res.status(403).json({ errore: "Nessun match approvato." });
        }

        const messaggi = await Messaggio.findAll({
            where: {
                id_segnalazione,
                [Op.or]: [ { id_mittente: mioId }, { id_destinatario: mioId } ]
            },
            include: [
                { model: Utente, as: 'Mittente', attributes: ['nome'] },
                { model: Utente, as: 'Destinatario', attributes: ['nome'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json(messaggi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nel recupero della chat" });
    }
});

// Invia un nuovo messaggio all'interno di una chat per un match approvato
router.post('/chat/:id_segnalazione', authMiddleware, async (req, res) => {
    try {
        const { id_segnalazione } = req.params;
        const { contenuto } = req.body;
        const mioId = req.user.id;

        const segnalazione = await Segnalazione.findByPk(id_segnalazione);
        if (!segnalazione) return res.status(404).json({ errore: "Segnalazione non trovata" });

        const matchApprovato = await Match.findOne({
            where: {
                [Op.or]: [
                    { id_segnalazione_ritrovato: id_segnalazione },
                    { id_segnalazione_smarrito: id_segnalazione }
                ],
                stato: 'approvato'
            }
        });

        if (!matchApprovato) {
            return res.status(403).json({ errore: "Chat non disponibile." });
        }

        let id_interlocutore;
        if (mioId === segnalazione.id_utente) {
            id_interlocutore = matchApprovato.id_utente_proponente;
        } else if (mioId === matchApprovato.id_utente_proponente) {
            id_interlocutore = segnalazione.id_utente;
        } else {
            return res.status(403).json({ errore: "Non autorizzato." });
        }

        await Messaggio.create({
            contenuto,
            id_segnalazione,
            id_mittente: mioId,
            id_destinatario: id_interlocutore
        });

        res.status(201).json({ messaggio: "Messaggio inviato!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errore: "Errore nell'invio" });
    }
});

module.exports = router;