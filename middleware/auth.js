/**
 * Middleware di autenticazione JWT.
 * Verifica la validità del token nelle richieste e protegge le rotte private.
 */

const jwt = require('jsonwebtoken');

// Estrae il token, lo verifica e inietta i dati dell'utente nella richiesta (req.user)
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ errore: "Accesso negato. Token mancante." });
    }

    try {
        const verificato = jwt.verify(token, "CHIAVE_SEGRETA_SUPER_SICURA_TIW");
        req.user = verificato;

        next();
    } catch (error) {
        res.status(403).json({ errore: "Token non valido o scaduto." });
    }
};