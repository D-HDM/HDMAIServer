const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../../config');
const usageService = require('../../services/usageService');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const mongoose = require('mongoose');
const chatStatus = require('../../services/chatStatus');
const { searchWeb, needsSearch, buildSearchContext, isFixtureQuery, FIXTURE_DOMAINS } = require('../../services/tavilyService');

const chat = async (req, res, next) => {
  const requestId = req.body.requestId || crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', requestId);

  try {
    const message = req.body.message || '';
    const conversationId = req.body.conversationId || null;
    const provider = req.body.provider;
    const data = req.body.data;
    const deepThink = req.body.deep_think === 'true';
    const searchEnabled = req.body.search_enabled === 'true';
    const files = req.files || [];
    const userId = req.user.sub;

    chatStatus.setStatus(requestId, 'thinking');

    let settings = null;
    try {
      if (mongoose.connection.db) {
        settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
      }
    } catch {}
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
      for (const file of files) {
        try {
          let raw;
          if (file.buffer) {
            raw = file.buffer.toString('utf-8');
          } else if (file.path) {
            raw = fs.readFileSync(file.path, 'utf-8');
            try { fs.unlinkSync(file.path); } catch {}
          } else {
            continue;
          }
          const content = raw.slice(0, 5000);
          fileContext += `\n[File: ${file.originalname}]\n${content}\n`;
        } catch {}
      }
    }

    const shouldSearch = message && (searchEnabled || needsSearch(message));
    let searchContext = '';

    if (shouldSearch) {
      const preDomains = isFixtureQuery(message) ? FIXTURE_DOMAINS.slice(0, 3) : [];
      chatStatus.setStatus(requestId, 'searching', { query: message, domains: preDomains });

      const searchData = await searchWeb(message);

      chatStatus.setStatus(requestId, 'searching', {
        query: message,
        domains: searchData.domains && searchData.domains.length > 0
          ? searchData.domains
          : preDomains,
      });

      searchContext = buildSearchContext(searchData);
      chatStatus.setStatus(requestId, 'thinking');
    }

    let systemPrompt = 'You are HDM AI, a helpful assistant.';
    if (searchContext) systemPrompt += `\n\n${searchContext}`;
    if (fileContext) systemPrompt += `\n\nThe user has uploaded files:\n${fileContext}`;
    if (deepThink) systemPrompt += '\nThink step by step.';

    if (!displayMessage && !fileContext) {
      chatStatus.setStatus(requestId, 'done');
      return res.json({ success: true, data: { reply: 'Please send a message or upload a file.', conversationId: conversation._id, requestId } });
    }

    if (!displayMessage && fileContext) {
      messages.push({ role: 'user', content: 'Please analyze the uploaded files.' });
    }

    const payload = {
      user_id: userId,
      message: message || '',
      messages,
      provider: finalProvider,
      system_prompt: systemPrompt,
      deep_think: deepThink,
    };
    if (data !== undefined && data !== null) payload.data = data;

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/chat`,
      payload,
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

    chatStatus.setStatus(requestId, 'done');
    res.json({
      success: true,
      data: {
        reply,
        conversationId: conversation._id,
        model: modelUsed,
        tokensUsed: tokens,
        provider: 'HDM AI',
        searched: shouldSearch,
        requestId,
      },
    });
  } catch (err) {
    console.error('Chat failed:', err.message);
    chatStatus.setStatus(requestId, 'error');
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'AI engine unavailable.' });
    }
  }
};

const streamChat = async (req, res, next) => {
  res.status(501).json({ success: false, error: 'Streaming not available.' });
};

module.exports = { chat, streamChat };