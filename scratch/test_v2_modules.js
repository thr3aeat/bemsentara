const ComponentsV2Factory = require("../bot/utils/componentsV2Factory");
const TypographyHelper = require("../bot/utils/typographyHelper");
const QuickChartHelper = require("../bot/utils/quickChartHelper");
const embeds = require("../bot/embeds");

console.log("=== Testing TypographyHelper ===");
console.log(TypographyHelper.h1("Test Header"));
console.log(TypographyHelper.subtext("Subtext message"));
console.log(TypographyHelper.quote("Quoted line"));
console.log("Timestamp:", TypographyHelper.timestamp(new Date(), "R"));

console.log("\n=== Testing ComponentsV2Factory ===");
const containerPayload = ComponentsV2Factory.buildPayload(0x5865F2, [
  ComponentsV2Factory.section(
    `${TypographyHelper.h2("🚀 Bot Güncelleme Duyurusu")}\nYeni nesil arayüz sistemine geçiş yapıldı!`,
    "https://i.imgur.com/example.png"
  ),
  ComponentsV2Factory.separator(true),
  ComponentsV2Factory.text(
    `- **Performans:** %40 Hız artışı\n- **Tasarım:** Modüler container mimarisi`
  ),
  ComponentsV2Factory.actionRow([
    { label: "Detayları Oku", custom_id: "read_more" }
  ])
]);
console.log("Container Payload Result:\n", JSON.stringify(containerPayload, null, 2));

console.log("\n=== Testing QuickChartHelper ===");
const chartPayload = QuickChartHelper.buildChartStatsV2({
  title: "Sunucu Aktiflik Grafiği",
  description: "Son 7 günün mesaj verileri",
  labels: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  values: [120, 190, 300, 500, 200, 450, 600],
  datasetLabel: "Mesajlar",
  chartType: "line",
  accentColor: 0x00FF88
});
console.log("Chart Payload Result:\n", JSON.stringify(chartPayload, null, 2));

console.log("\n=== Testing embeds.getSupportMenuV2() ===");
console.log("Support Menu V2 Result:\n", JSON.stringify(embeds.getSupportMenuV2(), null, 2));

console.log("\n✅ ALL V2 MODULE TESTS PASSED!");
