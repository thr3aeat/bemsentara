'use strict';

function buildTicketDeliveryResult(ticket) {
  return ticket?.channelId
    ? {
        deliveryStatus: 'delivered',
        deliveryMessage: 'Biletin Discord destek ekibine teslim edildi.'
      }
    : {
        deliveryStatus: 'queued',
        deliveryMessage: 'Biletin kaydedildi. Discord destek kanalına teslim edilmesi sıraya alındı.'
      };
}

function sortTicketsNewestFirst(tickets) {
  return [...(Array.isArray(tickets) ? tickets : [])].sort((a, b) => {
    const right = new Date(b?.createdAt || 0).getTime() || 0;
    const left = new Date(a?.createdAt || 0).getTime() || 0;
    return right - left;
  });
}

function normaliseComponentRows(rows) {
  if (!rows) return [];
  return Array.isArray(rows) ? rows : [rows];
}

module.exports = {
  buildTicketDeliveryResult,
  sortTicketsNewestFirst,
  normaliseComponentRows
};
