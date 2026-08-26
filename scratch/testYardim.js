const { EmbedBuilder } = require('discord.js');
const generalCommands = require('../bot/ekoyildiz/commands/general');
const yardimCmd = generalCommands.find(c => c.name === 'yardım');

const mockCommands = new Map();
// Add 133 mock commands to match EkoYildiz commands count
const categories = ['Kullanıcı', 'Eğlence', 'Moderasyon', 'Sistem', 'Ekonomi', 'Yetkili'];
for (let i = 1; i <= 60; i++) {
  const cat = categories[i % categories.length];
  const name = `testcommand_${i}`;
  mockCommands.set(name, {
    name: name,
    category: cat,
    description: `Açıklama ${i} test komut rehber mesajı`
  });
}

const mockMessage = {
  reply: async (payload) => {
    console.log("Reply called with payload:");
    console.log("Content:", payload.content);
    console.log("Embeds count:", payload.embeds?.length);
    if (payload.embeds) {
      payload.embeds.forEach((e, idx) => {
        console.log(`Embed #${idx}:`, JSON.stringify(e.toJSON(), null, 2));
      });
    }
  }
};

const mockContext = { commands: mockCommands };

yardimCmd.execute(mockMessage, [], mockContext).catch(err => {
  console.error("yardım execute Error:", err);
});
