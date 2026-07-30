const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const supportContentSchema = new mongoose.Schema({
  type: { type: String, default: 'support_content', unique: true },
  supportEmail: { type: String, default: '' },
  supportPhone: { type: String, default: '' },
  supportWhatsApp: { type: String, default: '' },
  appDownloadUrl: { type: String, default: '' },
  docsUrl: { type: String, default: '' },
  faq: [faqSchema],
  apiGuide: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

supportContentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SupportContent', supportContentSchema);