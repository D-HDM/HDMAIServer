// ====================================================================================================
// HDM AI Server — Usage Log Model
// ====================================================================================================

const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    module: {
      type: String,
      required: true,
      enum: ['general', 'smartpos', 'spark', 'vibe', 'vault', 'erp', 'widget'],
      index: true,
    },
    provider: {
      type: String,
      enum: ['groq', 'gemini'],
      default: 'groq',
    },
    endpoint: {
      type: String,
      default: '/chat',
    },
    model: String,
    tokensUsed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'error'],
      default: 'success',
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

usageLogSchema.index({ userId: 1, module: 1, createdAt: -1 });
usageLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);