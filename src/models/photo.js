const mongoose = require('mongoose');

//photo Schema
const photoSchema = new mongoose.Schema(
	{
		pic: {
			type: Buffer,
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

// to hide unnecessary details
photoSchema.methods.toJSON = function() {
	const photo = this;

	const photoObject = photo.toObject();

	delete photoObject.pic;

	return photoObject;
};

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
