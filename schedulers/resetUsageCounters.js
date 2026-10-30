const ProjectKey = require('../models/ProjectKey');
const UsageLog = require('../models/UsageLog');

const run = async () => {
  try {
    const result = await ProjectKey.updateMany(
      {},
      {
        $set: {
          requestsToday: 0,
          tokensToday: 0,
          lastResetAt: new Date(),
        },
      }
    );

    const usageReset = await UsageLog.updateMany(
      { date: { $lt: new Date(new Date().setHours(0, 0, 0, 0)) } },
      { $set: { archived: true } }
    );

    console.log(
      `[resetUsageCounters] keys=${result.modifiedCount} logs=${usageReset.modifiedCount}`
    );
  } catch (err) {
    console.error('[resetUsageCounters] failed:', err.message);
  }
};

module.exports = {
  name: 'resetUsageCounters',
  cronExpr: '0 0 * * *',
  run,
};