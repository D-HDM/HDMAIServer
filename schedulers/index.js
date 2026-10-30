const cleanupLearn = require('./cleanupLearn');
const resetUsageCounters = require('./resetUsageCounters');
const purgeStaleConversations = require('./purgeStaleConversations');

const JOBS = [cleanupLearn, resetUsageCounters, purgeStaleConversations];

let cron;
try {
  cron = require('node-cron');
} catch {
  console.warn('[schedulers] node-cron not installed; cron jobs skipped.');
}

const started = [];

const start = () => {
  for (const job of JOBS) {
    if (job.cronExpr) {
      if (!cron) continue;
      const task = cron.schedule(job.cronExpr, async () => {
        console.log(`[scheduler] ${job.name} firing (cron)`);
        try {
          await job.run();
        } catch (err) {
          console.error(`[scheduler] ${job.name} error:`, err.message);
        }
      });
      started.push({ name: job.name, kind: 'cron', ref: task });
      console.log(`[scheduler] ${job.name} scheduled cron="${job.cronExpr}"`);
      continue;
    }

    if (job.intervalMs) {
      const ref = setInterval(async () => {
        try {
          await job.run();
        } catch (err) {
          console.error(`[scheduler] ${job.name} error:`, err.message);
        }
      }, job.intervalMs);
      started.push({ name: job.name, kind: 'interval', ref });
      console.log(`[scheduler] ${job.name} every ${job.intervalMs / 1000}s`);
    }
  }
};

const stop = () => {
  for (const s of started) {
    if (s.kind === 'interval') clearInterval(s.ref);
    else if (s.ref?.stop) s.ref.stop();
  }
  started.length = 0;
  console.log('[scheduler] all jobs stopped');
};

module.exports = { start, stop, jobs: JOBS };