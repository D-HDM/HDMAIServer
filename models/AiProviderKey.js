// ====================================================================================================
// HDM AI Server — AI Provider Key Model
// Groq/Gemini keys per module (admin managed)
// ====================================================================================================

const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.INTERNAL_API_SECRET || 'dev-fallback-32-chars-key!!!!!';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const aiProviderKeySchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      enum: ['general', 'smartpos', 'spark', 'vibe', 'vault', 'erp', 'widget'],
    },
    provider: {
      type: String,
      required: true,
      enum: ['groq', 'gemini'],
    },
    encryptedKey: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTested: Date,
    testResult: String,
    totalRequests: {
      type: Number,
      default: 0,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

aiProviderKeySchema.index({ module: 1, provider: 1 }, { unique: true });

aiProviderKeySchema.methods.getDecryptedKey = function () {
  return decrypt(this.encryptedKey);
};

aiProviderKeySchema.statics.encryptKey = function (apiKey) {
  return encrypt(apiKey);
};

aiProviderKeySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.encryptedKey;
  return obj;
};

module.exports = mongoose.model('AiProviderKey', aiProviderKeySchema);