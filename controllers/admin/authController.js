const Admin = require('../../models/Admin');
const { generateToken } = require('../../utils/token');

// @desc    Admin login
// @route   POST /api/v1/admin/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    if (!admin.isActive) return res.status(403).json({ success: false, error: 'Account deactivated.' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials.' });

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, 'admin');
    res.json({ success: true, data: { accessToken: token, tokenType: 'bearer', role: admin.role, email: admin.email, username: admin.username }, message: 'Admin login successful.' });
  } catch (err) { next(err); }
};

module.exports = { login };