const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const quizQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctIndex: Number,
  userAnswer: Number,
  isCorrect: Boolean,
});

const quizSchema = new mongoose.Schema({
  questions: [quizQuestionSchema],
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  generatedAt: Date,
  completedAt: Date,
});

const flashcardSchema = new mongoose.Schema({
  term: String,
  definition: String,
});

const subtopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  status: { type: String, enum: ['locked', 'active', 'completed'], default: 'locked' },
  score: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  messages: [messageSchema],
  quiz: quizSchema,
  flashcards: [flashcardSchema],
  startedAt: Date,
  completedAt: Date,
});

const learnCurriculumSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String, required: true },
  subject: { type: String, default: 'general' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  language: { type: String, default: 'en' },
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  subtopics: [subtopicSchema],
  overallProgress: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  nextSuggestions: [String],
  knowledgePoints: [String],
  weakAreas: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

learnCurriculumSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LearnCurriculum', learnCurriculumSchema);