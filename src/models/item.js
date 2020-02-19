const mongoose = require('mongoose');

//item Schema
const itemSchema = new mongoose.Schema(
	{
		itemPic: {
			type: Buffer,
			required: true
		},
		name: {
			type: String,
			required: true
		},
		category: {
			type: String,
			required: true
		},
		price: {
			type: Number,
			default: 0,
			validate(value) {
				if (value < 0) {
					throw new Error('price must be a positive number');
				}
			}
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
itemSchema.methods.toJSON = function() {
	const item = this;

	const itemObject = item.toObject();

	delete itemObject.itemPic;

	return itemObject;
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
