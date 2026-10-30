const LearnConversation = require('../models/LearnConversation');

const MAX_MESSAGES_PER_CONVERSATION = 50;
const MAX_AGE_DAYS = 30;

const run = async () => {
  try {
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await LearnConversation.deleteMany({ updatedAt: { $lt: cutoff } });

    const oversized = await LearnConversation.find({
      messageCount: { $gt: MAX_MESSAGES_PER_CONVERSATION },
    }).select('_id messages');

    let trimmed = 0;
    for (const conv of oversized) {
      const keep = conv.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
      await LearnConversation.updateOne(
        { _id: conv._id },
        { $set: { messages: keep, messageCount: keep.length } }
      );
      trimmed += 1;
    }

    console.log(`[cleanupLearn] deleted=${deleted.deletedCount} trimmed=${trimmed}`);
  } catch (err) {
    console.error('[cleanupLearn] failed:', err.message);
  }
};

module.exports = { name: 'cleanupLearn', intervalMs: 6 * 60 * 60 * 1000, run };