const AiProviderKey = require('../../models/AiProviderKey');
const ProjectKey = require('../../models/ProjectKey');
const keyResolver = require('../../services/keyResolver');
const { generateApiKey, hashApiKey } = require('../../utils/token');

const PREFIXES = {
  general: 'hdm_gen_', smartpos: 'hdm_pos_', spark: 'hdm_spk_',
  vibe: 'hdm_vib_', vault: 'hdm_vlt_', erp: 'hdm_erp_', widget: 'hdm_wdg_',
};

const listAiKeys = async (req, res, next) => {
  try {
    const keys = await AiProviderKey.find().sort('module provider');
    res.json({ success: true, data: keys });
  } catch (err) { next(err); }
};

const upsertAiKey = async (req, res, next) => {
  try {
    const { module, provider, apiKey, model, isActive } = req.body;
    const encrypted = AiProviderKey.encryptKey(apiKey);

    const key = await AiProviderKey.findOneAndUpdate(
      { module, provider },
      { encryptedKey: encrypted, model, isActive: isActive ?? true },
      { upsert: true, new: true }
    );

    await keyResolver.refresh();
    res.json({ success: true, data: key, message: 'AI key saved.' });
  } catch (err) { next(err); }
};

const deleteAiKey = async (req, res, next) => {
  try {
    await AiProviderKey.findByIdAndDelete(req.params.id);
    await keyResolver.refresh();
    res.json({ success: true, message: 'AI key deleted.' });
  } catch (err) { next(err); }
};

const listProjectKeys = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, project, userId } = req.query;
    const query = {};
    if (project) query.project = project;
    if (userId) query.userId = userId;

    const keys = await ProjectKey.find(query).populate('userId', 'email username').skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt');
    const total = await ProjectKey.countDocuments(query);
    res.json({ success: true, data: { keys, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

const createProjectKey = async (req, res, next) => {
  try {
    const { userId, project, name } = req.body;
    if (!userId || !project) return res.status(400).json({ success: false, error: 'userId and project are required.' });

    const prefix = PREFIXES[project];
    if (!prefix) return res.status(400).json({ success: false, error: 'Invalid project.' });

    const fullKey = generateApiKey(prefix);
    const key = await ProjectKey.create({
      userId,
      project,
      name: name || 'Admin Generated',
      keyPrefix: fullKey.slice(0, 12) + '...',
      keyHash: hashApiKey(fullKey),
    });

    res.status(201).json({ success: true, data: { id: key._id, userId, project, keyPrefix: key.keyPrefix, name: key.name, fullKey }, message: 'Key created.' });
  } catch (err) { next(err); }
};

const revokeProjectKey = async (req, res, next) => {
  try {
    const key = await ProjectKey.findByIdAndDelete(req.params.id);
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });
    res.json({ success: true, message: 'Key permanently deleted.' });
  } catch (err) { next(err); }
};

module.exports = { listAiKeys, upsertAiKey, deleteAiKey, listProjectKeys, createProjectKey, revokeProjectKey };