const UsageLog = require('../models/UsageLog');

const usageService = {
  async log({ userId, module, provider, endpoint, model, tokensUsed, status, errorMessage }) {
    try {
      await UsageLog.create({ userId, module, provider, endpoint, model, tokensUsed, status, errorMessage });
    } catch (err) {
      console.error('Usage log failed:', err.message);
    }
  },

  async getStats({ module, userId, provider, startDate, endDate }) {
    const query = {};
    if (module) query.module = module;
    if (userId) query.userId = userId;
    if (provider) query.provider = provider;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const total = await UsageLog.countDocuments(query);
    const tokens = await UsageLog.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$tokensUsed' } } },
    ]);
    return { totalRequests: total, totalTokens: tokens[0]?.total || 0 };
  },
};

module.exports = usageService;