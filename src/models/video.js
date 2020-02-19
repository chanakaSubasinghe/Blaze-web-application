const mongoose = require('mongoose');

//video Schema
const videoSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true
		},
		videoID: {
			type: String,
			required: true
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		}
	},
	{
		timestamps: true
	}
);

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
