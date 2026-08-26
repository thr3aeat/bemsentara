const { commands } = require('../bot/ekoyildiz/commands');
const generalCommands = require('../bot/ekoyildiz/commands/general');
const yardimCmd = generalCommands.find(c => c.name === 'yardım');

const mockMessage = {
  reply: async (payload) => {
    console.log("Reply called!");
    console.log("Content:", payload.content);
    console.log("Embeds count:", payload.embeds?.length);
    if (payload.embeds) {
      payload.embeds.forEach((e, idx) => {
        const json = e.toJSON();
        console.log(`Embed #${idx} title: "${json.title}", fields count: ${json.fields?.length}`);
        if (json.fields) {
          json.fields.forEach((f, fIdx) => {
            console.log(`  Field #${fIdx} name: "${f.name}", val len: ${f.value?.length}`);
            if (!f.value || f.value.trim().length === 0) {
              console.error(`  ERROR: Field #${fIdx} HAS EMPTY VALUE!`);
            }
          });
        }
      });
    }
  }
};

const mockContext = { commands };

yardimCmd.execute(mockMessage, [], mockContext).catch(err => {
  console.error("yardım execute Error:", err);
});
