const mongoose = require('mongoose');

const getSettings = async (req, res, next) => {
  try {
    const collection = mongoose.connection.db.collection('settings');
    const settings = await collection.findOne({ type: 'ai_config' });
    res.json({ success: true, data: settings || { defaultProvider: 'groq', defaultModel: 'llama-3.3-70b-versatile', temperature: 0.7, maxTokens: 1024 } });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { defaultProvider, defaultModel, temperature, maxTokens, maxApiKeysPerUser } = req.body;

    if (defaultProvider && !['groq', 'gemini'].includes(defaultProvider)) {
      return res.status(400).json({ success: false, error: 'Provider must be groq or gemini.' });
    }
    if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
      return res.status(400).json({ success: false, error: 'Temperature must be 0-1.' });
    }
    if (maxTokens !== undefined && (maxTokens < 100 || maxTokens > 4096)) {
      return res.status(400).json({ success: false, error: 'Max tokens must be 100-4096.' });
    }
    if (maxApiKeysPerUser !== undefined && (maxApiKeysPerUser < 1 || maxApiKeysPerUser > 10)) {
      return res.status(400).json({ success: false, error: 'Max API keys must be 1-10.' });
    }

    const collection = mongoose.connection.db.collection('settings');
    const update = {};
    if (defaultProvider) update.defaultProvider = defaultProvider;
    if (defaultModel) update.defaultModel = defaultModel;
    if (temperature !== undefined) update.temperature = temperature;
    if (maxTokens !== undefined) update.maxTokens = maxTokens;
    if (maxApiKeysPerUser !== undefined) update.maxApiKeysPerUser = maxApiKeysPerUser;

    await collection.updateOne(
      { type: 'ai_config' },
      { $set: { ...update, updatedAt: new Date() } },
      { upsert: true }
    );

    const settings = await collection.findOne({ type: 'ai_config' });
    res.json({ success: true, data: settings, message: 'Settings updated.' });
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };