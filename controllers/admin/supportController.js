const SupportContent = require('../../models/SupportContent');

const getSupportContent = async (req, res, next) => {
  try {
    let content = await SupportContent.findOne({ type: 'support_content' });
    if (!content) {
      content = await SupportContent.create({ type: 'support_content' });
    }
    res.json({ success: true, data: content });
  } catch (err) { next(err); }
};

const updateSupportContent = async (req, res, next) => {
  try {
    const { supportEmail, supportPhone, supportWhatsApp, appDownloadUrl, docsUrl, faq, apiGuide } = req.body;
    const update = {};
    if (supportEmail !== undefined) update.supportEmail = supportEmail;
    if (supportPhone !== undefined) update.supportPhone = supportPhone;
    if (supportWhatsApp !== undefined) update.supportWhatsApp = supportWhatsApp;
    if (appDownloadUrl !== undefined) update.appDownloadUrl = appDownloadUrl;
    if (docsUrl !== undefined) update.docsUrl = docsUrl;
    if (faq !== undefined) update.faq = faq;
    if (apiGuide !== undefined) update.apiGuide = apiGuide;

    const content = await SupportContent.findOneAndUpdate(
      { type: 'support_content' },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: content, message: 'Support content updated.' });
  } catch (err) { next(err); }
};

module.exports = { getSupportContent, updateSupportContent };