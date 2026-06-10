/**
 * Entry point dei modelli del database (Sequelize).
 * Importa i singoli modelli e definisce tutte le relazioni e le associazioni (foreign keys) tra le tabelle.
 */

const Utente = require('./Utente');
const Segnalazione = require('./Segnalazione');
const Messaggio = require('./Messaggio');
const Match = require('./Match');
Utente.hasMany(Segnalazione, { foreignKey: 'id_utente', onDelete: 'CASCADE' });
Segnalazione.belongsTo(Utente, { foreignKey: 'id_utente' });
Segnalazione.hasMany(Messaggio, { foreignKey: 'id_segnalazione', onDelete: 'CASCADE' });
Messaggio.belongsTo(Segnalazione, { foreignKey: 'id_segnalazione' });
Utente.hasMany(Messaggio, { foreignKey: 'id_mittente', as: 'MessaggiInviati', onDelete: 'CASCADE' });
Utente.hasMany(Messaggio, { foreignKey: 'id_destinatario', as: 'MessaggiRicevuti', onDelete: 'CASCADE' });
Messaggio.belongsTo(Utente, { foreignKey: 'id_mittente', as: 'Mittente' });
Messaggio.belongsTo(Utente, { foreignKey: 'id_destinatario', as: 'Destinatario' });
Segnalazione.hasMany(Match, { foreignKey: 'id_segnalazione_smarrito', as: 'MatchSmarriti', onDelete: 'CASCADE' });
Segnalazione.hasMany(Match, { foreignKey: 'id_segnalazione_ritrovato', as: 'MatchRitrovati', onDelete: 'CASCADE' });
Match.belongsTo(Segnalazione, { foreignKey: 'id_segnalazione_smarrito', as: 'SegnalazioneSmarrita' });
Match.belongsTo(Segnalazione, { foreignKey: 'id_segnalazione_ritrovato', as: 'SegnalazioneRitrovata' });
Utente.hasMany(Match, { foreignKey: 'id_utente_proponente', as: 'MatchProposti', onDelete: 'CASCADE' });
Match.belongsTo(Utente, { foreignKey: 'id_utente_proponente', as: 'Proponente' });

module.exports = {
    Utente,
    Segnalazione,
    Messaggio,
    Match
};