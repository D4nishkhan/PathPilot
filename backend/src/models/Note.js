const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Markdown
    cheatsheet: { type: String }, // Markdown
    keyPoints: [{ type: String }],
    codeExamples: [
      {
        language: String,
        title: String,
        code: String,
        explanation: String,
      },
    ],
    estimatedReadTime: { type: Number, default: 5 }, // minutes
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
