// ====================================================================================================
// HDM AI Server — Message Model
// ====================================================================================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system'],
    },
    content: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    model: String,
    provider: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);