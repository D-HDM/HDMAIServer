// ====================================================================================================
// HDM AI Server — Conversation Model
// ====================================================================================================

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'New Conversation',
    },
    module: {
      type: String,
      enum: ['general', 'smartpos', 'spark', 'vibe', 'vault', 'erp', 'widget'],
      default: 'general',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    lastMessage: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Conversation', conversationSchema);