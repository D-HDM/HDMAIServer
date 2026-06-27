const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');

// @desc    List user conversations
// @route   GET /api/v1/conversations
// @access  Private
const list = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.sub, isActive: true }).sort('-updatedAt').limit(20);
    res.json({ success: true, data: conversations });
  } catch (err) { next(err); }
};

// @desc    Get conversation messages
// @route   GET /api/v1/conversations/:id
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });

    const messages = await Message.find({ conversationId: conversation._id }).sort('createdAt').limit(50);
    res.json({ success: true, data: { conversation, messages } });
  } catch (err) { next(err); }
};

// @desc    Delete conversation
// @route   DELETE /api/v1/conversations/:id
// @access  Private
const remove = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub },
      { isActive: false },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err) { next(err); }
};

module.exports = { list, getMessages, remove };