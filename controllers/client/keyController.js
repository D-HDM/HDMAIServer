const mongoose = require('mongoose');
const ProjectKey = require('../../models/ProjectKey');
const { generateApiKey, hashApiKey } = require('../../utils/token');
const emailService = require('../../services/emailService');
const User = require('../../models/User');

const PREFIXES = {
  general: 'hdm_gen_', smartpos: 'hdm_pos_', spark: 'hdm_spk_',
  vibe: 'hdm_vib_', vault: 'hdm_vlt_', erp: 'hdm_erp_', widget: 'hdm_wdg_',
};

const createKey = async (req, res, next) => {
  try {
    const { project, name } = req.body;
    const finalProject = project || 'general';

    if (finalProject !== 'general') {
      return res.status(403).json({ success: false, error: 'Only General AI keys are available. Other modules coming soon.' });
    }

    const prefix = PREFIXES[finalProject];
    if (!prefix) return res.status(400).json({ success: false, error: 'Invalid project.' });

    const settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
    const maxKeys = settings?.maxApiKeysPerUser || 3;

    const count = await ProjectKey.countDocuments({ userId: req.user.sub, isActive: true, project: finalProject });
    if (count >= maxKeys) {
      return res.status(429).json({ success: false, error: `Maximum ${maxKeys} API keys allowed. Revoke an existing key first.` });
    }

    const fullKey = generateApiKey(prefix);
    const key = await ProjectKey.create({
      userId: req.user.sub,
      project: finalProject,
      name: name || 'Default',
      keyPrefix: fullKey.slice(0, 12) + '...',
      keyHash: hashApiKey(fullKey),
    });

    await User.findByIdAndUpdate(req.user.sub, { $inc: { apiKeysCount: 1 } });

    const user = await User.findById(req.user.sub);
    await emailService.sendNewApiKeyEmail(user.email, user.username, finalProject, key.keyPrefix);

    res.status(201).json({ success: true, data: { id: key._id, project: finalProject, keyPrefix: key.keyPrefix, name: key.name, fullKey }, message: 'Key created. Save it now — shown only once.' });
  } catch (err) { next(err); }
};
const listKeys = async (req, res, next) => {
  try {
    const keys = await ProjectKey.find({ userId: req.user.sub, isActive: true }).sort('-createdAt');
    res.json({ success: true, data: keys });
  } catch (err) { next(err); }
};

const revokeKey = async (req, res, next) => {
  try {
    const key = await ProjectKey.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });

    await User.findByIdAndUpdate(req.user.sub, { $inc: { apiKeysCount: -1 } });

    res.json({ success: true, message: 'Key permanently deleted.' });
  } catch (err) { next(err); }
};

module.exports = { createKey, listKeys, revokeKey };