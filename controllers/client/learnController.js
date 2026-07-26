const LearnCurriculum = require('../../models/LearnCurriculum');
const axios = require('axios');
const config = require('../../config');

const listCurricula = async (req, res, next) => {
  try {
    const curricula = await LearnCurriculum.find({ userId: req.user.sub }).sort('-updatedAt');
    res.json({ success: true, data: curricula });
  } catch (err) { next(err); }
};

const getCurriculum = async (req, res, next) => {
  try {
    const curriculum = await LearnCurriculum.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!curriculum) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: curriculum });
  } catch (err) { next(err); }
};

const createCurriculum = async (req, res, next) => {
  try {
    const { topic, subject = 'general', level = 'beginner', language = 'en' } = req.body;

    const prompt = `Create a structured learning curriculum for "${topic}" at ${level} level.
Return JSON: { "subtopics": [{"title": "...", "order": 1}, ...] }
Include 5-8 subtopics in logical order. Output ONLY JSON.`;

    const response = await axios.post(`${config.pythonAiUrl}/api/v1/learn/chat`, {
      message: prompt,
      user_id: req.user.sub,
      temperature: 0.3,
      max_tokens: 500,
    }, { timeout: 30000 });

    let subtopics = [];
    try {
      const body = response.data?.data || response.data;
      const reply = body.reply || '';
      const json = JSON.parse(reply.replace(/```json|```/g, '').trim());
      subtopics = (json.subtopics || []).map((s, i) => ({
        title: s.title, order: i + 1, status: i === 0 ? 'active' : 'locked',
      }));
    } catch {
      subtopics = [{ title: `Introduction to ${topic}`, order: 1, status: 'active' }];
    }

    const curriculum = await LearnCurriculum.create({
      userId: req.user.sub, topic, subject, level, language, subtopics,
    });

    res.status(201).json({ success: true, data: curriculum });
  } catch (err) { next(err); }
};

const deleteCurriculum = async (req, res, next) => {
  try {
    await LearnCurriculum.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

const subtopicChat = async (req, res, next) => {
  try {
    const { id, subId } = req.params;
    const { message } = req.body;

    const curriculum = await LearnCurriculum.findOne({ _id: id, userId: req.user.sub });
    if (!curriculum) return res.status(404).json({ success: false, error: 'Not found' });

    const subtopic = curriculum.subtopics.id(subId);
    if (!subtopic) return res.status(404).json({ success: false, error: 'Subtopic not found' });

    subtopic.messages.push({ role: 'user', content: message });

    const contextMessages = subtopic.messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    contextMessages.unshift({
      role: 'system',
      content: `You are teaching "${subtopic.title}" as part of "${curriculum.topic}" at ${curriculum.level} level. Be educational, engaging, and concise.`,
    });

    const response = await axios.post(`${config.pythonAiUrl}/api/v1/learn/chat`, {
      messages: contextMessages,
      message: message,
      user_id: req.user.sub,
      temperature: 0.5,
      max_tokens: 1500,
    }, { timeout: 60000 });

    const body = response.data?.data || response.data;
    const reply = body.reply || 'Sorry, I could not process that.';

    subtopic.messages.push({ role: 'assistant', content: reply });
    await curriculum.save();

    res.json({ success: true, data: { reply, subtopic } });
  } catch (err) { next(err); }
};

const generateQuiz = async (req, res, next) => {
  try {
    const { id, subId } = req.params;
    const curriculum = await LearnCurriculum.findOne({ _id: id, userId: req.user.sub });
    if (!curriculum) return res.status(404).json({ success: false, error: 'Not found' });

    const subtopic = curriculum.subtopics.id(subId);
    if (!subtopic) return res.status(404).json({ success: false, error: 'Subtopic not found' });

    const prompt = `Generate 5 multiple-choice quiz questions about "${subtopic.title}" at ${curriculum.level} level.
Return JSON: {"questions": [{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0}]}
Output ONLY JSON.`;

    const response = await axios.post(`${config.pythonAiUrl}/api/v1/learn/chat`, {
      message: prompt,
      user_id: req.user.sub,
      temperature: 0.3,
      max_tokens: 800,
    }, { timeout: 30000 });

    let questions = [];
    try {
      const body = response.data?.data || response.data;
      const json = JSON.parse((body.reply || '').replace(/```json|```/g, '').trim());
      questions = json.questions || [];
    } catch {}

    subtopic.quiz = {
      questions: questions.map(q => ({
        question: q.question, options: q.options, correctIndex: q.correctIndex,
      })),
      score: 0, passed: false,
      attempts: (subtopic.quiz?.attempts || 0) + 1,
      generatedAt: new Date(),
    };

    await curriculum.save();

    const safeQuestions = subtopic.quiz.questions.map(q => ({
      question: q.question, options: q.options,
    }));

    res.json({ success: true, data: { questions: safeQuestions, attempt: subtopic.quiz.attempts } });
  } catch (err) { next(err); }
};

const submitQuiz = async (req, res, next) => {
  try {
    const { id, subId } = req.params;
    const { answers } = req.body;

    const curriculum = await LearnCurriculum.findOne({ _id: id, userId: req.user.sub });
    if (!curriculum) return res.status(404).json({ success: false, error: 'Not found' });

    const subtopic = curriculum.subtopics.id(subId);
    if (!subtopic || !subtopic.quiz?.questions?.length) {
      return res.status(400).json({ success: false, error: 'No quiz to submit' });
    }

    let correct = 0;
    answers.forEach(a => {
      const q = subtopic.quiz.questions[a.questionIndex];
      if (q) { q.userAnswer = a.answerIndex; q.isCorrect = a.answerIndex === q.correctIndex; if (q.isCorrect) correct++; }
    });

    const score = Math.round((correct / subtopic.quiz.questions.length) * 100);
    subtopic.quiz.score = score;
    subtopic.quiz.passed = score >= 60;
    subtopic.quiz.completedAt = new Date();

    if (subtopic.quiz.passed) {
      subtopic.status = 'completed'; subtopic.score = score; subtopic.completedAt = new Date();
      const nextSub = curriculum.subtopics.find(s => s.order === subtopic.order + 1);
      if (nextSub && nextSub.status === 'locked') nextSub.status = 'active';
      const allDone = curriculum.subtopics.every(s => s.status === 'completed');
      if (allDone) { curriculum.status = 'completed'; curriculum.completedAt = new Date(); curriculum.overallProgress = 100; }
    }

    const completed = curriculum.subtopics.filter(s => s.status === 'completed').length;
    curriculum.overallProgress = Math.round((completed / curriculum.subtopics.length) * 100);
    await curriculum.save();

    res.json({ success: true, data: { score, passed: subtopic.quiz.passed, correct, total: subtopic.quiz.questions.length, overallProgress: curriculum.overallProgress, nextSubtopicUnlocked: subtopic.quiz.passed } });
  } catch (err) { next(err); }
};

const generateFlashcards = async (req, res, next) => {
  try {
    const { id, subId } = req.params;
    const curriculum = await LearnCurriculum.findOne({ _id: id, userId: req.user.sub });
    if (!curriculum) return res.status(404).json({ success: false, error: 'Not found' });

    const subtopic = curriculum.subtopics.id(subId);
    if (!subtopic) return res.status(404).json({ success: false, error: 'Subtopic not found' });

    const prompt = `Generate 5 flashcards for "${subtopic.title}" about "${curriculum.topic}" at ${curriculum.level} level.
Return JSON: {"flashcards": [{"term": "...", "definition": "..."}]}
Output ONLY JSON.`;

    const response = await axios.post(`${config.pythonAiUrl}/api/v1/learn/chat`, {
      message: prompt, user_id: req.user.sub, temperature: 0.3, max_tokens: 500,
    }, { timeout: 30000 });

    try {
      const body = response.data?.data || response.data;
      const json = JSON.parse((body.reply || '').replace(/```json|```/g, '').trim());
      subtopic.flashcards = json.flashcards || [];
    } catch { subtopic.flashcards = []; }

    await curriculum.save();
    res.json({ success: true, data: { flashcards: subtopic.flashcards } });
  } catch (err) { next(err); }
};

const completeCurriculum = async (req, res, next) => {
  try {
    const curriculum = await LearnCurriculum.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!curriculum) return res.status(404).json({ success: false, error: 'Not found' });

    const prompt = `A student just completed "${curriculum.topic}" at ${curriculum.level} level.
Their weak areas: ${curriculum.weakAreas.join(', ') || 'none'}
Suggest: 1) Next level topic 2) 2-3 related topics 3) Topics to review.
Return JSON: {"nextLevel": "...", "relatedTopics": ["...", "..."], "reviewTopics": ["..."]}
Output ONLY JSON.`;

    const response = await axios.post(`${config.pythonAiUrl}/api/v1/learn/chat`, {
      message: prompt, user_id: req.user.sub, temperature: 0.3, max_tokens: 300,
    }, { timeout: 30000 });

    try {
      const body = response.data?.data || response.data;
      const json = JSON.parse((body.reply || '').replace(/```json|```/g, '').trim());
      curriculum.nextSuggestions = [json.nextLevel, ...(json.relatedTopics || [])];
    } catch { curriculum.nextSuggestions = [`Advanced ${curriculum.topic}`]; }

    curriculum.status = 'completed'; curriculum.completedAt = new Date(); curriculum.overallProgress = 100;
    await curriculum.save();
    res.json({ success: true, data: { suggestions: curriculum.nextSuggestions } });
  } catch (err) { next(err); }
};

module.exports = {
  listCurricula, getCurriculum, createCurriculum, deleteCurriculum,
  subtopicChat, generateQuiz, submitQuiz, generateFlashcards, completeCurriculum,
};