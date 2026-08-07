/**
 * quickChartHelper.js
 * 
 * QuickChart.io Dinamik Grafik Üretim Servisi
 */

const ComponentsV2Factory = require("./componentsV2Factory");
const TypographyHelper = require("./typographyHelper");

// QuickChart URL Önbelleği (5 dakikalık TTL)
const chartCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

class QuickChartHelper {
  /**
   * QuickChart URL'si oluşturur (Önbellekleme destekli)
   * @param {string[]} labels - X Ekseni etiketleri
   * @param {number[]} data - Veri noktaları
   * @param {string} datasetLabel - Veri kümesi adı
   * @param {string} chartType - Chart türü ('sparkline', 'line', 'bar', 'doughnut', 'pie')
   * @param {string} color - Hex renk kodu (Örn: '#5865F2')
   * @param {boolean} useCache - Önbellek kullanılsın mı?
   * @returns {string} QuickChart görsel URL'si
   */
  static getChartUrl({
    labels,
    data,
    datasetLabel = "Veriler",
    chartType = "sparkline",
    color = "#5865F2",
    width = 500,
    height = 200,
    useCache = true,
  }) {
    const cacheKey = JSON.stringify({ labels, data, datasetLabel, chartType, color, width, height });

    if (useCache && chartCache.has(cacheKey)) {
      const cached = chartCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.url;
      }
    }

    const chartConfig = {
      type: chartType,
      data: {
        labels: labels,
        datasets: [
          {
            label: datasetLabel,
            data: data,
            borderColor: color,
            backgroundColor: color.startsWith("#") ? `${color}33` : "rgba(88, 101, 242, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: chartType !== "sparkline",
            labels: { color: "#FFFFFF" },
          },
        },
      },
    };

    const url = `https://quickchart.io/chart?c=${encodeURIComponent(
      JSON.stringify(chartConfig)
    )}&w=${width}&h=${height}&bkg=transparent`;

    if (useCache) {
      chartCache.set(cacheKey, { url, timestamp: Date.now() });
    }

    return url;
  }

  /**
   * Components V2 içinde gösterilmeye hazır İstatistik Kartı Payload'ı üretir
   */
  static buildChartStatsV2({
    title,
    description,
    labels,
    values,
    datasetLabel,
    chartType = "sparkline",
    color = "#5865f2",
    useCache = true,
  }) {
    const chartUrl = this.getChartUrl({
      labels,
      data: values,
      datasetLabel: datasetLabel || title,
      chartType,
      color: color,
      useCache,
    });

    const components = [
      ...ComponentsV2Factory.headerBlock(title, "📈"),
      ...(description ? [ComponentsV2Factory.text(description), ComponentsV2Factory.separator(false)] : []),
      ComponentsV2Factory.mediaGallery([chartUrl]),
      ComponentsV2Factory.separator(false),
      ComponentsV2Factory.text(
        TypographyHelper.subtext(`Sentara Dynamic QuickChart • ${TypographyHelper.timestamp(new Date(), "R")}`)
      ),
    ];

    return ComponentsV2Factory.buildPayload(components);
  }
}

module.exports = QuickChartHelper;

