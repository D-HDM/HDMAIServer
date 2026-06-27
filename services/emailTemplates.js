// ====================================================================================================
// HDM AI Server — Email Templates
// ====================================================================================================

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const APP_NAME = process.env.APP_NAME || 'HDM AI';

const style = `
  body{font-family:Arial,sans-serif;background:#0a0a0a;color:#e0e0e0;margin:0;padding:0}
  .c{max-width:480px;margin:40px auto;background:#141414;border-radius:12px;padding:32px;border:1px solid #222}
  .l{font-size:24px;font-weight:bold;color:#00e676;text-align:center;margin-bottom:24px}
  h2{color:#fff;margin-bottom:16px}
  p{line-height:1.6;color:#b0b0b0;margin-bottom:16px}
  .btn{display:inline-block;background:#00e676;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold}
  .code{background:#1a1a1a;padding:12px;border-radius:6px;font-family:monospace;font-size:16px;text-align:center;color:#fff}
  .ft{margin-top:32px;font-size:12px;color:#555;text-align:center;border-top:1px solid #222;padding-top:16px}
  .warn{color:#ff5252}
`;

const wrap = (content) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>${style}</style></head><body>
<div class="c"><div class="l">${APP_NAME}</div>${content}<div class="ft">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</div></div>
</body></html>`;

module.exports = {
  verifyEmail: (username, link) => ({
    subject: `Verify your ${APP_NAME} email address`,
    htmlBody: wrap(`<h2>Verify Your Email</h2><p>Hey ${username}, welcome to ${APP_NAME}! Click below to verify your email.</p><p style="text-align:center"><a href="${link}" class="btn">Verify Email</a></p><p>Or: <small>${link}</small></p><p class="warn">Expires in 24 hours.</p>`),
    textBody: `Hey ${username}, verify your email: ${link}`,
  }),
  welcome: (username) => ({
    subject: `Welcome to ${APP_NAME} 🚀`,
    htmlBody: wrap(`<h2>Welcome!</h2><p>Hey ${username}, your account is ready. Chat with AI, generate API keys, and connect your business systems.</p><p style="text-align:center"><a href="${CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a></p>`),
    textBody: `Welcome to ${APP_NAME}, ${username}! Visit ${CLIENT_URL}/dashboard to start.`,
  }),
  passwordReset: (username, link) => ({
    subject: `Reset your ${APP_NAME} password`,
    htmlBody: wrap(`<h2>Reset Password</h2><p>Hey ${username}, click below to reset your password.</p><p style="text-align:center"><a href="${link}" class="btn">Reset Password</a></p><p>Or: <small>${link}</small></p><p class="warn">Expires in 1 hour. Ignore if this wasn't you.</p>`),
    textBody: `Hey ${username}, reset your password: ${link}`,
  }),
  passwordChanged: (username) => ({
    subject: `Your ${APP_NAME} password was changed`,
    htmlBody: wrap(`<h2>Password Changed</h2><p>Hey ${username}, your password was just changed. If this wasn't you, contact support immediately.</p>`),
    textBody: `Hey ${username}, your ${APP_NAME} password was changed. Contact support if this wasn't you.`,
  }),
  newApiKey: (username, project, keyPrefix) => ({
    subject: `New API key created — ${APP_NAME}`,
    htmlBody: wrap(`<h2>New API Key</h2><p>Hey ${username}, a new key was created for <strong>${project}</strong>.</p><div class="code">${keyPrefix}...</div><p class="warn">Full key shown once. Lost it? Revoke and regenerate.</p>`),
    textBody: `Hey ${username}, a new API key for ${project}: ${keyPrefix}... Manage at ${CLIENT_URL}/dashboard/keys.`,
  }),
  accountDeleted: (username) => ({
    subject: `Your ${APP_NAME} account has been deleted`,
    htmlBody: wrap(`<h2>Account Deleted</h2><p>Hey ${username}, your account and all data have been permanently deleted. You can create a new account anytime.</p>`),
    textBody: `Hey ${username}, your ${APP_NAME} account has been deleted. Register again at ${CLIENT_URL}/register.`,
  }),
  accountDeletedByAdmin: (username) => ({
    subject: `Your ${APP_NAME} account has been deleted`,
    htmlBody: wrap(`<h2>Account Deleted</h2><p>Hey ${username}, your account has been deleted by an administrator. Contact support if this was a mistake.</p>`),
    textBody: `Hey ${username}, your ${APP_NAME} account was deleted by an admin. Contact support.`,
  }),
};