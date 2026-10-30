const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const learnConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  projectKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectKey', default: null },
  topic: String,
  subject: { type: String, default: 'general' },
  level: { type: String, default: 'beginner' },
  language: { type: String, default: 'en' },
  messages: [messageSchema],
  lastMessage: String,
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

learnConversationSchema.index({ projectKeyId: 1, isActive: 1, updatedAt: -1 });

module.exports = mongoose.model('LearnConversation', learnConversationSchema);