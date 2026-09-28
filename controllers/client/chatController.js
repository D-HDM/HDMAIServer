const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const mongoose = require('mongoose');

const chat = async (req, res, next) => {
  try {
    const message = req.body.message || '';
    const conversationId = req.body.conversationId || null;
    const provider = req.body.provider;
    const data = req.body.data;
    const deepThink = req.body.deep_think === 'true';
    const files = req.files || [];
    const userId = req.user.sub;

    const settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
    const finalProvider = provider || settings?.defaultProvider || 'groq';

    let conversation = conversationId ? await Conversation.findOne({ _id: conversationId, userId }) : null;
    if (!conversation) {
      const title = message ? message.slice(0, 50) : (files.length ? `Files: ${files.map(f => f.originalname).join(', ')}`.slice(0, 50) : 'New Chat');
      conversation = await Conversation.create({ userId, title });
    }

    const displayMessage = message || (files.length ? `Analyze these files: ${files.map(f => f.originalname).join(', ')}` : '');
    if (displayMessage) {
      await Message.create({ conversationId: conversation._id, role: 'user', content: displayMessage });
    }

    const history = await Message.find({ conversationId: conversation._id }).sort('createdAt').limit(20);
    const messages = history.map(m => ({ role: m.role, content: m.content }));

    let fileContext = '';
    if (files.length > 0) {
      const fs = require('fs');
      for (const file of files) {
        try {
          const content = fs.readFileSync(file.path, 'utf-8').slice(0, 5000);
          fileContext += `\n[File: ${file.originalname}]\n${content}\n`;
          fs.unlinkSync(file.path);
        } catch {}
      }
    }

    let systemPrompt = 'You are HDM AI, a helpful assistant.';
    if (fileContext) systemPrompt += `\n\nThe user has uploaded files:\n${fileContext}`;
    if (deepThink) systemPrompt += '\nThink step by step.';

    if (!displayMessage && !fileContext) {
      return res.json({ success: true, data: { reply: 'Please send a message or upload a file.', conversationId: conversation._id } });
    }

    if (!displayMessage && fileContext) {
      messages.push({ role: 'user', content: 'Please analyze the uploaded files.' });
    }

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/chat`,
      {
        user_id: userId,
        message: message || '',
        messages,
        provider: finalProvider,
        system_prompt: systemPrompt,
        data,
        deep_think: deepThink,
      },
      { timeout: 60000 }
    );

    const body = response.data?.data || response.data;
    const reply = body.reply || 'AI unavailable.';
    const tokens = body.tokens_used || 0;
    const modelUsed = body.model || 'HDM Nova';

    await Message.create({ conversationId: conversation._id, role: 'assistant', content: reply, tokensUsed: tokens, model: modelUsed, provider: 'HDM AI' });
    conversation.messageCount += 2;
    conversation.totalTokens += tokens;
    conversation.lastMessage = reply.slice(0, 100);
    await conversation.save();

    await usageService.log({ userId, module: 'chat', provider: 'HDM AI', endpoint: '/chat', model: modelUsed, tokensUsed: tokens, status: 'success' });

    res.json({ success: true, data: { reply, conversationId: conversation._id, model: modelUsed, tokensUsed: tokens, provider: 'HDM AI' } });
  } catch (err) {
    console.error('Chat failed:', err.message);
    res.status(500).json({ success: false, error: 'AI engine unavailable.' });
  }
};

const streamChat = async (req, res, next) => {
  res.status(501).json({ success: false, error: 'Streaming not available.' });
};

module.exports = { chat, streamChat };