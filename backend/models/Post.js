const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true,
    maxLength: 5000
  },
  images: [{
    type: String,
    maxLength: 500
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'posts'
});

module.exports = mongoose.model('Post', postSchema);