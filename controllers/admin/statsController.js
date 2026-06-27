const usageService = require('../../services/usageService');
const User = require('../../models/User');
const ProjectKey = require('../../models/ProjectKey');
const AiProviderKey = require('../../models/AiProviderKey');
const keyResolver = require('../../services/keyResolver');
const pythonClient = require('../../services/pythonClient');

const dashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeKeys = await ProjectKey.countDocuments({ isActive: true });
    const aiKeys = await AiProviderKey.countDocuments({ isActive: true });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayRequests = await usageService.getStats({ startDate: today });
    const pythonHealth = await pythonClient.health();
    const keyCache = keyResolver.getCache();

    res.json({
      success: true,
      data: {
        totalUsers,
        activeProjectKeys: activeKeys,
        activeAiKeys: aiKeys,
        requestsToday: todayRequests.totalRequests,
        tokensToday: todayRequests.totalTokens,
        pythonStatus: pythonHealth?.status || 'unreachable',
        keyCache,
      },
    });
  } catch (err) { next(err); }
};

const usage = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const modules = ['general', 'smartpos', 'spark', 'vibe', 'vault', 'erp', 'widget'];
    const services = {};
    const keyTotals = { key1: 0, key2: 0, key3: 0, key4: 0 };

    for (const m of modules) {
      const todayStats = await usageService.getStats({ module: m, startDate: today });
      const monthStats = await usageService.getStats({ module: m, startDate: monthStart });

      let keyLabel;
      if (m === 'general') keyLabel = 'Key 1';
      else if (m === 'erp') keyLabel = 'Key 2';
      else if (m === 'smartpos') keyLabel = 'Key 3';
      else keyLabel = 'Key 4';

      const keyMap = { 'Key 1': 'key1', 'Key 2': 'key2', 'Key 3': 'key3', 'Key 4': 'key4' };
      keyTotals[keyMap[keyLabel]] += todayStats.totalRequests;

      services[m] = {
        name: m.charAt(0).toUpperCase() + m.slice(1),
        requests_today: todayStats.totalRequests,
        requests_month: monthStats.totalRequests,
        tokens_today: todayStats.totalTokens,
        key: keyLabel,
        usage_percent: todayStats.totalRequests ? Math.round((todayStats.totalRequests / 1440) * 1000) / 10 : 0,
      };
    }

    const groqToday = await usageService.getStats({ provider: 'groq', startDate: today });
    const groqMonth = await usageService.getStats({ provider: 'groq', startDate: monthStart });
    const geminiToday = await usageService.getStats({ provider: 'gemini', startDate: today });
    const geminiMonth = await usageService.getStats({ provider: 'gemini', startDate: monthStart });

    const totalToday = groqToday.totalRequests + geminiToday.totalRequests;
    const totalMonth = groqMonth.totalRequests + geminiMonth.totalRequests;
    const totalTokens = groqToday.totalTokens + geminiToday.totalTokens;

    res.json({
      success: true,
      data: {
        services,
        keys: {
          key_1: { label: 'Key 1', services: 'General AI', requests_today: keyTotals.key1, limit_per_day: 1440, usage_percent: keyTotals.key1 ? Math.round((keyTotals.key1 / 1440) * 1000) / 10 : 0 },
          key_2: { label: 'Key 2', services: 'ERP', requests_today: keyTotals.key2, limit_per_day: 1440, usage_percent: keyTotals.key2 ? Math.round((keyTotals.key2 / 1440) * 1000) / 10 : 0 },
          key_3: { label: 'Key 3', services: 'SmartPOS', requests_today: keyTotals.key3, limit_per_day: 1440, usage_percent: keyTotals.key3 ? Math.round((keyTotals.key3 / 1440) * 1000) / 10 : 0 },
          key_4: { label: 'Key 4', services: 'Spark, Vibe, Vault, Widget', requests_today: keyTotals.key4, limit_per_day: 1440, usage_percent: keyTotals.key4 ? Math.round((keyTotals.key4 / 1440) * 1000) / 10 : 0 },
        },
        providers: {
          groq: { name: 'Groq (Llama 3.3 70B)', requests_today: groqToday.totalRequests, requests_month: groqMonth.totalRequests, tokens_today: groqToday.totalTokens, limit_requests_per_day: 5760, usage_percent_today: groqToday.totalRequests ? Math.round((groqToday.totalRequests / 5760) * 1000) / 10 : 0, status: 'active' },
          gemini: { name: 'Gemini (Flash/Pro)', requests_today: geminiToday.totalRequests, requests_month: geminiMonth.totalRequests, limit_flash_per_day: 1500, status: 'active', usage_percent_today: geminiToday.totalRequests ? Math.round((geminiToday.totalRequests / 1500) * 1000) / 10 : 0 },
          code_execution: { name: 'Local Python/JS/Bash', status: 'active', limit: 'unlimited' },
        },
        overall: {
          total_requests_today: totalToday,
          total_requests_month: totalMonth,
          total_tokens_today: totalTokens,
          free_tier_savings: '~$800/month vs paid equivalents (4 free keys × $200 each)',
        },
      },
    });
  } catch (err) { next(err); }
};

module.exports = { dashboard, usage };