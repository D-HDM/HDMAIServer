const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const INACTIVE_AFTER_DAYS = 90;

const run = async () => {
  try {
    const cutoff = new Date(Date.now() - INACTIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);

    const deactivated = await Conversation.updateMany(
      { isActive: true, updatedAt: { $lt: cutoff } },
      { $set: { isActive: false } }
    );

    const activeIds = await Conversation.distinct('_id');
    const orphanMsgs = await Message.deleteMany({
      conversationId: { $nin: activeIds },
    });

    console.log(
      `[purgeStaleConversations] deactivated=${deactivated.modifiedCount} orphans=${orphanMsgs.deletedCount}`
    );
  } catch (err) {
    console.error('[purgeStaleConversations] failed:', err.message);
  }
};

module.exports = {
  name: 'purgeStaleConversations',
  intervalMs: 24 * 60 * 60 * 1000,
  run,
};