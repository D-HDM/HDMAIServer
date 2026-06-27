const pythonClient = require('../../services/pythonClient');
const keyResolver = require('../../services/keyResolver');
const usageService = require('../../services/usageService');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const mongoose = require('mongoose');

const chat = async (req, res, next) => {
  try {
    const { module } = req.params;
    const message = req.body.message || '';
    const conversationId = req.body.conversationId || null;
    const provider = req.body.provider;
    const model = req.body.model;
    const temperature = req.body.temperature;
    const maxTokens = req.body.maxTokens;
    const data = req.body.data;
    const searchEnabled = req.body.search_enabled === 'true';
    const deepThink = req.body.deep_think === 'true';
    const files = req.files || [];
    const userId = req.user.sub;

    const settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
    const finalProvider = provider || settings?.defaultProvider || 'groq';
    const finalModel = model || settings?.defaultModel || 'llama-3.3-70b-versatile';
    const finalTemperature = temperature ?? settings?.temperature ?? 0.7;
    const finalMaxTokens = maxTokens || settings?.maxTokens || 1024;

    let conversation = conversationId ? await Conversation.findOne({ _id: conversationId, userId }) : null;
    if (!conversation) {
      const title = message ? message.slice(0, 50) : (files.length ? `Files: ${files.map(f => f.originalname).join(', ')}`.slice(0, 50) : 'New Chat');
      conversation = await Conversation.create({ userId, title, module });
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
    if (fileContext) systemPrompt += `\n\nThe user has uploaded files for analysis:\n${fileContext}\nAnalyze the file contents and respond helpfully.`;
    if (deepThink) systemPrompt += '\nUse chain-of-thought reasoning. Think step by step.';
    if (searchEnabled) systemPrompt += '\nThe user has search enabled. Provide up-to-date information if relevant.';

    if (!displayMessage && !fileContext) {
      return res.json({ success: true, data: { reply: 'Please send a message or upload a file.', conversationId: conversation._id } });
    }

    if (!displayMessage && fileContext) {
      messages.push({ role: 'user', content: 'Please analyze the uploaded files.' });
    }

    messages.unshift({ role: 'system', content: systemPrompt });

    const resolved = await keyResolver.resolve(module, finalProvider);
    const result = await pythonClient.chat({
      messages, userId, module, provider: finalProvider,
      model: finalModel || resolved?.model,
      temperature: finalTemperature, maxTokens: finalMaxTokens, data,
    });

    const reply = result?.data?.reply || result?.reply || 'AI unavailable.';
    const tokens = result?.data?.tokensUsed || result?.tokensUsed || 0;
    const modelUsed = result?.data?.model || finalModel;

    await Message.create({ conversationId: conversation._id, role: 'assistant', content: reply, tokensUsed: tokens, model: modelUsed, provider: finalProvider });
    conversation.messageCount += 2;
    conversation.totalTokens += tokens;
    conversation.lastMessage = reply.slice(0, 100);
    await conversation.save();

    await usageService.log({ userId, module, provider: finalProvider, endpoint: '/chat', model: modelUsed, tokensUsed: tokens, status: 'success' });

    res.json({ success: true, data: { reply, conversationId: conversation._id, model: modelUsed, tokensUsed: tokens, provider: finalProvider } });
  } catch (err) { next(err); }
};

const streamChat = async (req, res, next) => {
  try {
    const { module } = req.params;
    const message = req.body.message || '';
    const conversationId = req.body.conversationId || null;
    const provider = req.body.provider;
    const model = req.body.model;
    const temperature = req.body.temperature;
    const maxTokens = req.body.maxTokens;
    const data = req.body.data;
    const deepThink = req.body.deep_think === 'true';
    const files = req.files || [];
    const userId = req.user.sub;

    const settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
    const finalProvider = provider || settings?.defaultProvider || 'groq';
    const finalModel = model || settings?.defaultModel || 'llama-3.3-70b-versatile';
    const finalTemperature = temperature ?? settings?.temperature ?? 0.7;
    const finalMaxTokens = maxTokens || settings?.maxTokens || 1024;

    let conversation = conversationId ? await Conversation.findOne({ _id: conversationId, userId }) : null;
    if (!conversation) {
      const title = message ? message.slice(0, 50) : (files.length ? `Files: ${files.map(f => f.originalname).join(', ')}`.slice(0, 50) : 'New Chat');
      conversation = await Conversation.create({ userId, title, module });
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
    if (deepThink) systemPrompt += '\nUse chain-of-thought reasoning. Think step by step.';

    if (!displayMessage && fileContext) {
      messages.push({ role: 'user', content: 'Please analyze the uploaded files.' });
    }

    messages.unshift({ role: 'system', content: systemPrompt });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullReply = '';
    await pythonClient.stream({
      messages, userId, module, provider: finalProvider, model: finalModel,
      temperature: finalTemperature, maxTokens: finalMaxTokens, data,
      onChunk: (chunk) => { fullReply += chunk; res.write(`data: ${JSON.stringify({ chunk })}\n\n`); },
    });

    await Message.create({ conversationId: conversation._id, role: 'assistant', content: fullReply, model: finalModel, provider: finalProvider });
    conversation.messageCount += 2;
    conversation.lastMessage = fullReply.slice(0, 100);
    await conversation.save();

    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`);
    res.end();
  } catch (err) { next(err); }
};

module.exports = { chat, streamChat };