const { AttachmentBuilder } = require("discord.js");
let createCanvas;
try {
  createCanvas = require("@napi-rs/canvas").createCanvas;
} catch (_) {
  try {
    createCanvas = require("canvas").createCanvas;
  } catch (_) {
    createCanvas = null;
  }
}

/**
 * $EKO Index Borsa Mum & Çizgi Grafiği Çizici Servisi
 */
class StockChartService {
  /**
   * Borsa Mum Grafiği (Candlestick Chart) Çizer
   */
  static async generateStockChart(stockName = "$EKO Index", dataPoints = []) {
    if (!createCanvas) return null;
    // Örnek mum verisi yoksa simüle edilmiş 10 veri noktası oluştur
    if (!dataPoints || dataPoints.length === 0) {
      let current = 100;
      dataPoints = Array.from({ length: 10 }, (_, i) => {
        const open = current;
        const change = (Math.random() - 0.45) * 15;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        current = close;
        return { open, high, low, close, label: `Day ${i + 1}` };
      });
    }

    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arka Plan
    ctx.fillStyle = "#1e222d";
    ctx.fillRect(0, 0, width, height);

    // Grid Çizgileri
    ctx.strokeStyle = "#2a2e39";
    ctx.lineWidth = 1;
    for (let y = 50; y < height - 50; y += 50) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
    }

    // Başlık
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`📈 ${stockName} Canlı Borsa Grafiği`, 50, 40);

    // Min / Max Hesaplama
    const allPrices = dataPoints.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices) * 0.95;
    const maxPrice = Math.max(...allPrices) * 1.05;
    const priceRange = maxPrice - minPrice;

    const chartWidth = width - 100;
    const chartHeight = height - 100;
    const candleWidth = (chartWidth / dataPoints.length) * 0.6;
    const stepX = chartWidth / dataPoints.length;

    // Mumları Çiz
    dataPoints.forEach((d, i) => {
      const x = 50 + i * stepX + stepX / 2;
      const isGreen = d.close >= d.open;
      const color = isGreen ? "#26a69a" : "#ef5350";

      const highY = 50 + chartHeight - ((d.high - minPrice) / priceRange) * chartHeight;
      const lowY = 50 + chartHeight - ((d.low - minPrice) / priceRange) * chartHeight;
      const openY = 50 + chartHeight - ((d.open - minPrice) / priceRange) * chartHeight;
      const closeY = 50 + chartHeight - ((d.close - minPrice) / priceRange) * chartHeight;

      // Fitil (Wick)
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Gövde (Body)
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 4);
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    const buffer = await canvas.encode("png");
    return new AttachmentBuilder(buffer, { name: "stock_chart.png" });
  }
}

module.exports = StockChartService;
