const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    youtubeId: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    duration: { type: Number, required: true }, // seconds
    thumbnailUrl: String,
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    order: { type: Number, default: 0 },
    tags: [String],
    transcript: String,
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Video', videoSchema);
