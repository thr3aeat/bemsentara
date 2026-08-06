'use strict';

const Property = require('../../models/Property');
const StaffProgress = require('../../models/StaffProgress');

function computePrice(property) {
  if (!property) return 0;
  const base = Number(property.baseValue || 0);
  const vol = Number(property.volatility || 0.05);
  // Simple price model: base * (1 + vol * ageHoursFactor)
  const last = property.lastActivityAt ? new Date(property.lastActivityAt).getTime() : Date.now();
  const ageHours = Math.max(0, (Date.now() - last) / (1000 * 60 * 60));
  const timeFactor = 1 + vol * Math.min(48, ageHours) / 24; // up to ~2x over 48h
  return Math.max(100, Math.round(base * timeFactor));
}

async function listActiveProperties(limit = 4) {
  const props = await Property.find().limit(limit).lean();
  return props.map(p => ({ ...p, currentPrice: computePrice(p) }));
}

async function buyProperty(buyerId, propertyId, price) {
  const prop = await Property.findById(propertyId);
  if (!prop) return { success: false, message: 'Property not found' };
  if (!prop.forSale) return { success: false, message: 'Property is not for sale' };
  const currentPrice = computePrice(prop);
  if (price < currentPrice) return { success: false, message: 'Offered price too low' };

  // transfer ownership
  prop.ownerId = buyerId;
  prop.forSale = false;
  prop.lastActivityAt = new Date();
  await prop.save();

  const p = await StaffProgress.findOne({ userId: buyerId });
  if (p) {
    p.portfolio = p.portfolio || [];
    p.portfolio.push({ propertyId: prop._id.toString(), purchasedAt: new Date(), purchasePrice: currentPrice });
    await p.save();
  }

  return { success: true, property: prop, purchasedAtPrice: currentPrice };
}

async function sellProperty(sellerId, propertyId) {
  const prop = await Property.findById(propertyId);
  if (!prop) return { success: false, message: 'Property not found' };
  if (prop.ownerId !== sellerId) return { success: false, message: 'Not owner' };

  const currentPrice = computePrice(prop);

  // Remove from owner's portfolio
  const p = await StaffProgress.findOne({ userId: sellerId });
  if (p && Array.isArray(p.portfolio)) {
    p.portfolio = p.portfolio.filter(x => x.propertyId !== prop._id.toString());
    await p.save();
  }

  // Reset ownership and put back for sale
  prop.ownerId = null;
  prop.forSale = true;
  prop.lastActivityAt = new Date();
  await prop.save();

  return { success: true, soldFor: currentPrice };
}

/**
 * Generates a Components V2 payload showcasing active properties for sale
 */
async function getPropertyMarketV2Payload(limit = 4) {
  const ComponentsV2Factory = require('../utils/componentsV2Factory');
  const TypographyHelper = require('../utils/typographyHelper');
  const QuickChartHelper = require('../utils/quickChartHelper');
  const { ButtonStyle } = require('discord.js');

  const properties = await listActiveProperties(limit);

  const labels = properties.map(p => p.name || `Mülk #${p._id.toString().slice(-4)}`);
  const prices = properties.map(p => p.currentPrice || 100);

  const chartUrl = QuickChartHelper.getChartUrl({
    labels,
    data: prices,
    datasetLabel: "Mülk Fiyatları",
    chartType: "bar",
    color: "#FFD700",
    width: 450,
    height: 180,
  });

  const propText = properties.length > 0
    ? properties.map((p, idx) => `${idx + 1}. **${p.name || "Gayrimenkul"}** — 💰 **$${p.currentPrice.toLocaleString()}** (Sahip: ${p.ownerId ? `<@${p.ownerId}>` : "Devlet / Satılık"})`).join("\n")
    : "Şu anda piyasada aktif satılık gayrimenkul yok.";

  return ComponentsV2Factory.buildPayload(0xFFD700, [
    ...ComponentsV2Factory.headerBlock("Sentara Gayrimenkul & Pazar Yeri", "🏢"),
    ComponentsV2Factory.section(
      `Sunucumuzun dinamik pazar yerinde mülk satın alabilir veya portföyünüzdeki gayrimenkulleri satışa çıkarabilirsiniz.\n\n` +
      `📈 **Piyasa Fiyatlandırma Trendi:** Zamana bağlı volatilite bazlı hesaplanır.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(
      `🏛️ **Satıştaki Gayrimenkuller Listesi:**\n${propText}`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(`📊 **Fiyat Endeksi Grafiği:**`),
    ComponentsV2Factory.mediaGallery([chartUrl]),
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.text(
      TypographyHelper.subtext(`Sentara Real Estate Engine • ${TypographyHelper.timestamp(new Date(), "R")}`)
    ),
    ComponentsV2Factory.actionRow([
      { custom_id: "property_buy_menu", label: "🏢 Mülk Satın Al", style: ButtonStyle.Success },
      { custom_id: "property_sell_menu", label: "💰 Mülkümü Sat", style: ButtonStyle.Primary },
    ]),
  ]);
}

module.exports = { computePrice, listActiveProperties, buyProperty, sellProperty, getPropertyMarketV2Payload };

