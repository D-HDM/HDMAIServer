const crypto = require('crypto');
const User = require('../../models/User');
const { generateToken, generateVerificationToken, generateResetToken } = require('../../utils/token');
const emailService = require('../../services/emailService');
const config = require('../../config');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered.' });

    const user = await User.create({ email, username, passwordHash: password });

    const { token, hash, expires } = generateVerificationToken();
    user.verificationToken = hash;
    user.verificationTokenExpires = expires;
    await user.save();

    const verifyLink = `${config.clientUrl}/verify-email?token=${token}`;
    await emailService.sendVerificationEmail(user.email, user.username, verifyLink);

    res.status(201).json({ success: true, message: 'Registration successful. Check your email to verify your account.' });
  } catch (err) { next(err); }
};

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hash,
      verificationTokenExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired verification token.' });

    user.isVerified = true;
    user.isActive = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    await emailService.sendWelcomeEmail(user.email, user.username);

    const jwt = generateToken(user._id, 'user');
    res.json({ success: true, data: { accessToken: jwt, tokenType: 'bearer', role: 'user', email: user.email, username: user.username }, message: 'Email verified. Welcome!' });
  } catch (err) { next(err); }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    if (!user.isVerified) return res.status(403).json({ success: false, error: 'Please verify your email first.' });
    if (!user.isActive) return res.status(403).json({ success: false, error: 'Account deactivated.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid email or password.' });

    user.lastLogin = new Date();
    await user.save();

    const jwt = generateToken(user._id, 'user');
    res.json({ success: true, data: { accessToken: jwt, tokenType: 'bearer', role: 'user', email: user.email, username: user.username }, message: 'Login successful.' });
  } catch (err) { next(err); }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const { token, hash, expires } = generateResetToken();
    user.resetToken = hash;
    user.resetTokenExpires = expires;
    await user.save();

    const resetLink = `${config.clientUrl}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, user.username, resetLink);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hash,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });

    user.passwordHash = password;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    await emailService.sendPasswordChangedEmail(user.email, user.username);

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (err) { next(err); }
};

// @desc    Delete own account
// @route   DELETE /api/v1/auth/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Incorrect password.' });

    await user.deleteOne();
    await emailService.sendAccountDeletedEmail(user.email, user.username);

    res.json({ success: true, message: 'Account permanently deleted.' });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    if (username) user.username = username;
    await user.save();

    res.json({ success: true, data: { email: user.email, username: user.username }, message: 'Profile updated.' });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect.' });

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed.' });
  } catch (err) { next(err); }
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, deleteAccount, updateProfile, changePassword };