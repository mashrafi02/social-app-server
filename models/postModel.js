const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema;

const postSchema = new Schema({
  type: {
    type: String,
    enum: ["profilePic", "coverPic", "regular"],
    default: "regular",
    required: true
  },

  contentType: {
    type: String,
    enum: ["text", "image", "video", "mixed"],
    default: "text",
    required : true,
  },

  images: [{ type: String }],
  videos: [{ type: String }],

  text: { type: String, trim: true },
  background: { type: String},

  user: {
    type: ObjectId,
    ref: "users",
    required: true,
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
        default: 'like'
      }
    },
  ],

  shares:[
    {
      user: {
        type: ObjectId,
        ref: "users",
        required: true,
      },
    }
  ],

  commentsCount: { type: Number, default: 0 },
  reactsCount: { type: Number, default: 0 },
  sharesCount: { type:Number, default: 0}

}, { timestamps: true });

postSchema.index({ user: 1, createdAt: -1 });

const Post = mongoose.model('posts', postSchema);
module.exports = Post;
