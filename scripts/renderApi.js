'use strict';

const axios = require('axios');

const RENDER_API_KEY = process.env.RENDER_API_KEY || '';

/**
 * Lists all services on Render.com
 */
async function listServices() {
  if (!RENDER_API_KEY) {
    console.warn('⚠️ RENDER_API_KEY bulunamadı. Render Dashboard -> Account Settings -> API Keys kısmından key ekleyin.');
    return null;
  }

  try {
    const res = await axios.get('https://api.render.com/v1/services', {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    return res.data;
  } catch (err) {
    console.error('[Render API] Servis listeleme hatası:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Triggers a new deploy for a specific service ID
 */
async function triggerDeploy(serviceId) {
  if (!RENDER_API_KEY) {
    console.warn('⚠️ RENDER_API_KEY bulunamadı.');
    return null;
  }

  try {
    const res = await axios.post(`https://api.render.com/v1/services/${serviceId}/deploys`, {}, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    return res.data;
  } catch (err) {
    console.error('[Render API] Deploy tetikleme hatası:', err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  listServices,
  triggerDeploy
};
