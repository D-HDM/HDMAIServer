const mongoose = require('mongoose');

const projectKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    project: {
      type: String,
      required: true,
      enum: ['general', 'smartpos', 'spark', 'vibe', 'vault', 'erp', 'widget'],
    },
    name: {
      type: String,
      trim: true,
      default: 'Default',
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: Date,
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

projectKeySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.keyHash;
  return obj;
};

module.exports = mongoose.model('ProjectKey', projectKeySchema);