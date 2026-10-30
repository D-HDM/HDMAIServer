const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');
const LearnConversation = require('../../models/LearnConversation');
const { searchWeb, needsSearch, buildSearchContext } = require('../../services/tavilyService');

const HISTORY_LIMIT = 10;

const learnCompletion = async (req, res, next) => {
  try {
    const {
      message,
      conversationId,
      history,
      topic,
      subject = 'general',
      level = 'beginner',
      language = 'en',
      search_enabled,
    } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required.' });
    }

    const projectKey = req.projectKey;
    const userId = projectKey?.userId?.toString() || 'external';

    // Build messages array
    let priorMessages = [];
    let conversation = null;

    if (conversationId) {
      conversation = await LearnConversation.findOne({
        _id: conversationId,
        projectKeyId: projectKey?._id,
        isActive: true,
      });
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found.' });
      }
      priorMessages = conversation.messages.slice(-HISTORY_LIMIT).map(m => ({ role: m.role, content: m.content }));
    } else if (Array.isArray(history)) {
      priorMessages = history.slice(-HISTORY_LIMIT).map(m => ({ role: m.role, content: m.content }));
    }

    // Search
    const shouldSearch = search_enabled === true || needsSearch(message);
    let searchContext = '';
    if (shouldSearch) {
      const searchData = await searchWeb(message);
      searchContext = buildSearchContext(searchData);
    }

    const systemPrompt = [
      `You are Mr. HDM, a friendly and patient teacher.`,
      `Topic: ${topic || 'General knowledge'}.`,
      `Subject: ${subject}.`,
      `Level: ${level}.`,
      `Language: ${language}.`,
      `Be clear, use examples, and keep answers concise.`,
      searchContext ? `\n${searchContext}` : '',
    ].filter(Boolean).join(' ');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...priorMessages,
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/learn/chat`,
      {
        message,
        messages,
        user_id: userId,
        system_prompt: systemPrompt,
        temperature: 0.5,
        max_tokens: 1500,
      },
      { timeout: 60000 }
    );

    const body = response.data?.data || response.data;
    const reply = body.reply || 'Sorry, I could not process that.';
    const tokens = body.tokens_used || 0;
    const modelUsed = body.model || 'HDM Nova';

    // Persist conversation
    if (conversationId || req.body.persist === true) {
      if (!conversation) {
        conversation = await LearnConversation.create({
          projectKeyId: projectKey?._id || null,
          userId: projectKey?.userId || null,
          topic, subject, level, language,
          messages: [],
        });
      }
      conversation.messages.push({ role: 'user', content: message });
      conversation.messages.push({ role: 'assistant', content: reply });
      conversation.messageCount += 2;
      conversation.lastMessage = reply.slice(0, 100);
      await conversation.save();
    }

    if (projectKey) {
      projectKey.totalRequests += 1;
      projectKey.tokensUsed += tokens;
      projectKey.lastUsed = new Date();
      await projectKey.save();
    }

    await usageService.log({
      userId: projectKey?.userId || null,
      module: 'learn',
      provider: 'HDM AI',
      endpoint: '/learn/completion',
      model: modelUsed,
      tokensUsed: tokens,
      status: 'success',
    });

    res.json({
      success: true,
      data: {
        reply,
        model: modelUsed,
        tokens_used: tokens,
        provider: 'HDM AI',
        searched: shouldSearch,
        conversationId: conversation?._id || null,
      },
    });
  } catch (err) {
    console.error('Learn completion failed:', err.message);
    await usageService.log({
      userId: req.projectKey?.userId || null,
      module: 'learn',
      provider: 'HDM AI',
      endpoint: '/learn/completion',
      tokensUsed: 0,
      status: 'error',
      errorMessage: err.message,
    });
    res.status(500).json({ success: false, error: 'Learn AI engine unavailable.' });
  }
};

module.exports = { learnCompletion };