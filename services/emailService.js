// ====================================================================================================
// HDM AI Server — Email Service
// ====================================================================================================

const HDM_BRIDGE = require('../config/hdmbridge');
const emailTemplates = require('./emailTemplates');

const emailService = {
  sendVerificationEmail(to, username, link) {
    const t = emailTemplates.verifyEmail(username, link);
    return HDM_BRIDGE.send({ to, ...t });
  },
  sendWelcomeEmail(to, username) {
    const t = emailTemplates.welcome(username);
    return HDM_BRIDGE.send({ to, ...t });
  },
  sendPasswordResetEmail(to, username, link) {
    const t = emailTemplates.passwordReset(username, link);
    return HDM_BRIDGE.send({ to, ...t });
  },
  sendPasswordChangedEmail(to, username) {
    const t = emailTemplates.passwordChanged(username);
    return HDM_BRIDGE.send({ to, ...t });
  },
  sendNewApiKeyEmail(to, username, project, keyPrefix) {
    const t = emailTemplates.newApiKey(username, project, keyPrefix);
    return HDM_BRIDGE.send({ to, ...t });
  },
  sendAccountDeletedEmail(to, username) {
    const t = emailTemplates.accountDeleted(username);
    return HDM_BRIDGE.send({ to, ...t });
  },
  sendAccountDeletedByAdminEmail(to, username) {
    const t = emailTemplates.accountDeletedByAdmin(username);
    return HDM_BRIDGE.send({ to, ...t });
  },
};

module.exports = emailService;