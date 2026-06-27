const User = require('../../models/User');
const emailService = require('../../services/emailService');

// @desc    List all users
// @route   GET /api/v1/admin/users
// @access  Admin
const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find().skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt');
    const total = await User.countDocuments();
    res.json({ success: true, data: { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Admin
const getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Admin
const update = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    await user.save();
    res.json({ success: true, data: user, message: 'User updated.' });
  } catch (err) { next(err); }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Super Admin
const remove = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    await emailService.sendAccountDeletedByAdminEmail(user.email, user.username);
    res.json({ success: true, message: 'User permanently deleted.' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, update, remove };