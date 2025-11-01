const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema;

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: ObjectId,
      ref: "posts",
      required: true,
    },

    user: {
      type: ObjectId,
      ref: "users",
      required: true,
    },

    text: {
      type: String,
      trim: true,
    },

    image: {
      type: String, 
    },

    parentComment: {
      type: ObjectId,
      ref: "comments",
      default: null,
    },

    reacts: [
      {
        user: {
          type: ObjectId,
          ref: "users",
        },
        type: {
          type: String,
          enum: ['like', 'love', 'angry', 'funny', 'wow', 'care'],
          default: 'like',
        },
      },
    ],

    reactsCount: { type: Number, default: 0 },
  }, { timestamps: true }
);

const Comment = mongoose.model("comments", commentSchema);
module.exports = Comment;
