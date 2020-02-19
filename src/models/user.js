const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Item = require('../models/item');
const Photo = require('../models/photo');
const Video = require('../models/video');
const Carousel = require('../models/carousel');

//userSchema
const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Email is invalid!');
				}
			}
		},

		password: {
			type: String,
			required: true,
			trim: true,
			minlength: 8,
			validate(value) {
				if (value.toLowerCase().includes('password')) {
					throw new Error('password cannot contain "password"');
				}
			}
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		]
	},
	{
		timestamps: true
	}
);

// relationship with item model
userSchema.virtual('items', {
	ref: 'Item',
	localField: '_id',
	foreignField: 'owner'
});

// relationship with photo model
userSchema.virtual('photos', {
	ref: 'Photo',
	localField: '_id',
	foreignField: 'owner'
});

// relationship with videos model
userSchema.virtual('videos', {
	ref: 'Video',
	localField: '_id',
	foreignField: 'owner'
});

// relationship with carousel model
userSchema.virtual('carousels', {
	ref: 'Carousel',
	localField: '_id',
	foreignField: 'owner'
});

// to hide unnecessary details
userSchema.methods.toJSON = function() {
	const user = this;

	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;

	return userObject;
};

// generating new auth token
userSchema.methods.generateAuthToken = async function() {
	const user = this;

	const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

	user.tokens = user.tokens.concat({ token });

	await user.save();

	return token;
};

// checking valid user with email and password
userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });
	if (!user) {
		throw new Error(`The email address that you've entered is invalid!`);
	}
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error(`The email address and the password that you've entered doesn't match any account!`);
	}
	return user;
};

// things to be fire before save the user
userSchema.pre('save', async function(next) {
	const user = this;

	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8);
	}

	next();
});

// things to be fire after user remove
userSchema.pre('remove', async function(next) {
	const user = this;

	await Item.deleteMany({ owner: user._id });
	await Photo.deleteMany({ owner: user._id });
	await Video.deleteMany({ owner: user._id });
	await Carousel.deleteMany({ owner: user._id });
	next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
