// ====================================================================================================
// HDM AI Server — Third Party Key Model
// User's external API keys (OpenAI, Anthropic, etc.)
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

const thirdPartyKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    encryptedKey: {
      type: String,
      required: true,
    },
    baseUrl: String,
    apiStructure: {
      type: Map,
      of: String,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastTested: Date,
    testResult: String,
  },
  {
    timestamps: true,
  }
);

thirdPartyKeySchema.index({ userId: 1, provider: 1 });

thirdPartyKeySchema.methods.getDecryptedKey = function () {
  return decrypt(this.encryptedKey);
};

thirdPartyKeySchema.statics.encryptKey = function (apiKey) {
  return encrypt(apiKey);
};

thirdPartyKeySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.encryptedKey;
  return obj;
};

module.exports = mongoose.model('ThirdPartyKey', thirdPartyKeySchema);