const { REST, Routes } = require("discord.js");
const { TOKEN, BOT_ID, TARGET_GUILD_ID, GUILD2_ID, TMT_GUILD_ID } = require("../config");
const { allCommands } = require("./allCommands");
const logger = require("../utils/logger");

async function registerAllCommands(clientId = BOT_ID) {
  try {
    const cid = clientId || BOT_ID;
    if (!cid) {
      throw new Error("Client ID (BOT_ID) bulunamadı. Slash komutlar kaydedilemez.");
    }
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    logger.section("SLASH COMMANDS");
    logger.step(`Toplam komut sayısı: ${allCommands.length}`);

    if (allCommands.length <= 100) {
      await rest.put(Routes.applicationCommands(cid), { body: allCommands });
      logger.success(`${allCommands.length} slash komut (global) kaydedildi.`);
    } else {
      const firstBatch = allCommands.slice(0, 100);
      const remainder = allCommands.slice(100);

      await rest.put(Routes.applicationCommands(cid), { body: firstBatch });
      logger.warn(`Global komutlar 100 ile sınırlı. İlk 100 komut global olarak kaydedildi, kalan ${remainder.length} komut tüm sunuculara (guild-level) kaydedilecek.`);

      const guildIdSet = new Set([TARGET_GUILD_ID, GUILD2_ID, TMT_GUILD_ID].filter(Boolean));
      try {
        const botGuilds = await rest.get(Routes.userGuilds());
        if (Array.isArray(botGuilds)) {
          for (const g of botGuilds) {
            if (g && g.id) guildIdSet.add(g.id);
          }
        }
      } catch (listErr) {
        logger.warn(`Bot sunucu listesi alınamadı, yapılandırılmış guild ID'leri kullanılacak: ${listErr.message}`);
      }

      const targetGuilds = [...guildIdSet];
      if (targetGuilds.length === 0) {
        logger.error("Kalan komutları kaydetmek için hiçbir hedef sunucu (guild) bulunamadı.");
      } else {
        for (const gid of targetGuilds) {
          try {
            await rest.put(Routes.applicationGuildCommands(cid, gid), { body: remainder });
            logger.success(`Kalan ${remainder.length} komut guild ${gid} için kaydedildi.`);
          } catch (gErr) {
            logger.warn(`Guild ${gid} için komut kaydı başarısız: ${gErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error("Slash komut kayıt hatası:", err.message);
    if (err.rawError) {
      logger.error("Detay:", err.rawError);
    }
    if (err.status) {
      logger.error("Status:", err.status);
    }
  }
}

module.exports = { registerAllCommands };
