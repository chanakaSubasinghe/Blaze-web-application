const express = require('express');
const Item = require('../models/item');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();

//uploading images and validations
const upload = multer({
	limits: {
		fileSize: 1000000 //maximum size of an image
	},
	fileFilter(req, file, cb) {
		// checking if file extension does not match with jpg,png,jpeg
		if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
			return cb(new Error('Please upload a image.')); // if it is then throw an error
		}
		cb(undefined, true);
	}
});

//create item
router.post(
	'/items',
	auth,
	upload.single('itemPic'),
	async (req, res) => {
		try {
			// uploading image and resize with sharp and save it in a variable as a buffer
			const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

			// create a new Item
			const item = new Item({
				...req.body,
				itemPic: buffer,
				owner: req.user._id
			});

			// save it in the database
			await item.save();

			// send a success message to user
			req.flash('success', 'Successfully added item.');

			//redirect to adminPanel
			res.redirect('/adminPanel');
		} catch (e) {
			req.flash('error', 'Something went wrong!'); // throw an error
			res.status(400).redirect('/adminPanel');
		}
	},
	(error, req, res, next) => {
		req.flash('error', error.message); // if there are errors with uploading images then throw an error
		res.status(400).redirect('/adminPanel');
	}
);

//read item
router.get('/items/:id', auth, async (req, res) => {
	try {
		// assigning ID to a variable
		const _id = req.params.id;

		// checking an item with that ID
		const item = await Item.findOne({ _id, owner: req.user._id });

		// if invalid item throw an error
		if (!item) {
			req.flash('error', 'Item not found!');

			//redirect to adminPanel
			return res.status(404).redirect('/adminPanel');
		}

		// if valid item send response with editItem page
		res.render('admin-editItem', {
			item
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!'); // throw an error
		res.status(500).redirect('/items');
	}
});

// GET /items?category=cap
// GET /items?limit=10&skip=10
// GET /items?sortBy=price:desc

//read items
router.get('/items', async (req, res) => {
	try {
		// assigning all items to a variable
		const itemCategories = await Item.find({});

		// assigning pagination value to a variable and default it is 9
		const pagination = req.query.pagination ? parseInt(req.query.pagination) : 9;

		// assigning page value to a variable and default it is 1
		const page = req.query.page ? parseInt(req.query.page) : 1;

		// create an empty variable for sortBy category
		let totalDocuments;

		// check if category value provided
		if (req.query.category) {
			// assigning all items by provided category with pagination and page values
			items = await Item.find({ category: req.query.category })
				.limit(pagination)
				.skip((page - 1) * pagination)
				.sort({ createdAt: -1 }); // sorting all items descending order by date

			// count all filtered items and save it a variable
			totalDocuments = await Item.find({ category: req.query.category }).countDocuments();
		} else {
			// if no category provided then assigning all items with pagination and page values and sorted by date
			items = await Item.find({}).limit(pagination).skip((page - 1) * pagination).sort({ createdAt: -1 });

			// count all filtered items and save it a variable
			totalDocuments = await Item.estimatedDocumentCount();
		}

		// get a nearest around value of total document divided by pagination
		let total = Math.ceil(totalDocuments / pagination);

		// get an integer value for how many pages regarding to total document
		const totalPages = Array(total).fill().map((e, i) => i + 1);

		// create an empty array
		const allCategories = [];

		// push every item's categories to that variable
		itemCategories.forEach(function(item) {
			allCategories.push(item.category);
		});

		// get unique categories from all categories
		const uniqueCategories = allCategories.filter(function(elem, index, self) {
			return index == self.indexOf(elem);
		});

		// send the response with items page and above values
		res.render('items', {
			items,
			categories: uniqueCategories,
			totalPages,
			page,
			total,
			category: req.query.category
		});
	} catch (e) {
		req.flash('error', e.message); // throw an error
		res.status(500).redirect('/');
	}
});

// --------------------------------------------------------------------

//  when updating an item there are two path,
// 		 1. a route for item's image
// 		 2. a route for item's description

// ---------------------------------------------------------------------

// update item image
router.patch(
	'/items/itemPic/:id',
	auth,
	upload.single('itemPic'),
	async (req, res) => {
		try {
			// uploading image and resize with sharp and save it a variable as a buffer
			const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

			// checking valid item with ID
			const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });

			// if invalid item
			if (!item) {
				req.flash('error', 'Item not found!'); //throw an error
				return res.status(404).redirect('/items');
			}

			// save buffer value in the item
			item.itemPic = buffer;

			// save in the DB
			await item.save();

			//send success message to user
			req.flash('success', 'Successfully updated item image');
			res.redirect('/items/' + req.params.id); // redirect to particular item page
		} catch (e) {
			req.flash('error', 'Something went wrong!'); // throw an error
			res.status(400).redirect('/items');
		}
	},
	(error, req, res, next) => {
		req.flash('error', error.message); // throw an error if there are errors with uploading files
		res.status(400).redirect('/items/' + req.params.id);
	}
);

// update item
router.patch('/items/:id', auth, async (req, res) => {
	try {
		// assigning all keys in the req.body to a variable
		const updates = Object.keys(req.body);

		// assigning valid keys to a variable
		const allowedUpdates = [ 'name', 'price', 'category' ];

		// checking if valid operation in the update variable
		const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

		// if invalid field
		if (!isValidOperation) {
			req.flash('error', 'Invalid updates!'); //throw an error
			return res.status(400).redirect('/items');
		}

		// check for one item given by ID
		const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });

		// if no item found
		if (!item) {
			req.flash('error', 'Item not found!'); // throw an error
			return res.status(404).redirect('/items');
		}

		// if free to go then updating new values
		updates.forEach((update) => (item[update] = req.body[update]));

		// save updated item in the DB
		await item.save();

		// send success message to user
		req.flash('success', 'Successfully updated item.');
		res.redirect('/items');
	} catch (e) {
		req.flash('error', 'Something went wrong!'); //throw an error
		res.status(400).redirect('/items');
	}
});

//delete item
router.delete('/items/:id', auth, async (req, res) => {
	try {
		// find the item and delete it
		const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

		// if invalid item
		if (!item) {
			req.flash('error', 'Item not found!'); // throw an error
			return res.status(404).redirect('/items');
		}

		// if valid item send a success message to user
		req.flash('success', 'Successfully deleted item!');
		res.redirect('/items');
	} catch (e) {
		req.flash('error', 'Something went wrong!'); //throw an error
		res.status(500).redirect('/items');
	}
});

// fetching item image
router.get('/items/:id/itemPic', async (req, res) => {
	try {
		// find an item by given id
		const item = await Item.findById(req.params.id);

		// set the response as image/png and send it
		res.set('Content-Type', 'image/png');
		res.send(item.itemPic);
	} catch (e) {
		req.flash('error', 'Something went wrong!'); // throw an error
		res.status(500).redirect('/items');
	}
});

module.exports = router;
