'use strict';

function render404Page(user, requestedPath = '') {
  const content = `
    <style>
      .error-container {
        max-width: 800px;
        margin: 4rem auto 6rem;
        padding: 0 1.5rem;
        text-align: center;
        font-family: 'Outfit', sans-serif;
      }
      .error-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 3.5rem 2rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        position: relative;
        overflow: hidden;
      }
      .error-card::before {
        content: '';
        position: absolute;
        top: -80px;
        left: 50%;
        transform: translateX(-50%);
        width: 250px;
        height: 250px;
        background: radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
      }
      .error-code {
        font-size: 6.5rem;
        font-weight: 900;
        line-height: 1;
        background: linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
        letter-spacing: -0.05em;
      }
      .error-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.3);
        padding: 5px 16px;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 1.5rem;
      }
      .error-title {
        font-size: 1.85rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 1rem 0;
      }
      .error-desc {
        color: var(--muted, #94a3b8);
        font-size: 1.05rem;
        line-height: 1.6;
        max-width: 540px;
        margin: 0 auto 2rem;
      }
      .error-path {
        display: inline-block;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 4px 12px;
        border-radius: 8px;
        font-family: monospace;
        color: #c4b5fd;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
      }
      .error-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
      }
      .btn-glow {
        background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
        color: #fff;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
        transition: all 0.2s ease;
      }
      .btn-glow:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
        color: #fff;
      }
      .btn-outline {
        background: rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .btn-outline:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        color: #fff;
        transform: translateY(-2px);
      }
    </style>

    <div class="error-container">
      <div class="error-card">
        <div class="error-badge">🚨 404 — SAYFA MEVZUATTA BULUNAMADI</div>
        <div class="error-code">404</div>
        <h1 class="error-title">Aradığınız Sayfa Mevcut Değil veya Kaldırıldı</h1>
        <p class="error-desc">
          Ulaşmaya çalıştığınız dijital kayıt veya sayfa sunucu sisteminde kayıtlı bulunmamaktadır.
          Lütfen girdiğiniz URL adresini kontrol ediniz veya resmi sayfalara dönünüz.
        </p>
        ${requestedPath ? `<div class="error-path">İstenen Yol: ${requestedPath.replace(/</g, '&lt;')}</div>` : ''}
        <div class="error-actions">
          <a href="/" class="btn-glow">🏠 Ana Sayfaya Dön</a>
          <a href="/anayasasi" class="btn-outline">📜 EkoYıldız Anayasası</a>
          <a href="/dashboard" class="btn-outline">📊 Dashboard</a>
          <a href="/tickets" class="btn-outline">🎫 Destek Talebi</a>
        </div>
      </div>
    </div>
  `;

  const { _layout } = require("../views");
  return _layout("404 — Sayfa Bulunamadı", user, content, "", "");
}

module.exports = {
  render404Page
};
