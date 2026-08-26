try {
  const service = require('../bot/services/reklamTicketService');
  console.log("SUCCESS: reklamTicketService required cleanly! Exports count:", Object.keys(service).length);
} catch (err) {
  console.error("FAILED to require reklamTicketService:", err.stack || err);
}
