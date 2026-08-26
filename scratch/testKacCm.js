const funCommands = require('../bot/ekoyildiz/commands/fun');
const kaccmCmd = funCommands.find(c => c.name === 'kaçcm');

const mockMessage = {
  author: {
    id: '123456789',
    username: 'TestUser',
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
  },
  mentions: {
    users: {
      first: () => null
    }
  },
  client: {
    user: {
      displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
    }
  },
  reply: async (payload) => {
    console.log("SUCCESS: kaçcm reply executed!");
    return {
      createMessageComponentCollector: () => ({
        on: () => {}
      })
    };
  }
};

kaccmCmd.execute(mockMessage).then(() => {
  console.log("kaçcm executed cleanly with NO errors!");
}).catch(err => {
  console.error("kaçcm execute ERROR:", err);
});
