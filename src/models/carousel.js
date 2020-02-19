const mongoose = require('mongoose');

//carousel Schema
const carouselSchema = new mongoose.Schema(
	{
		carouselPic: {
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
carouselSchema.methods.toJSON = function() {
	const carousel = this;

	const carouselObject = carousel.toObject();

	delete carouselObject.carouselPic;

	return carouselObject;
};

const Carousel = mongoose.model('Carousel', carouselSchema);

module.exports = Carousel;
