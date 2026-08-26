const { handleSelectInteraction } = require('../bot/handlers/selectHandler');

const mockInteraction = {
  customId: 'ekoyildiz_support_category',
  values: ['reklam_destek'],
  showModal: async (modal) => {
    console.log("SUCCESS: showModal called with customId:", modal.data?.custom_id || modal.customId);
  },
  reply: async (payload) => console.log("Reply called:", payload),
  deferReply: async () => {},
  editReply: async (payload) => console.log("EditReply called:", payload)
};

handleSelectInteraction(mockInteraction).then(() => {
  console.log("handleSelectInteraction test completed cleanly!");
}).catch(err => {
  console.error("handleSelectInteraction test ERROR:", err);
});
