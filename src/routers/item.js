const express = require('express');
const Item = require('../models/item');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();

const upload = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
			return cb(new Error('Please upload a image.'));
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
			const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
			const item = new Item({
				...req.body,
				itemPic: buffer,
				owner: req.user._id
			});

			await item.save();
			req.flash('success', 'Successfully added item.');
			res.redirect('/adminPanel');
		} catch (e) {
			req.flash('error', 'Something went wrong!');
			res.status(400).redirect('/adminPanel');
		}
	},
	(error, req, res, next) => {
		req.flash('error', error.message);
		res.status(400).redirect('/adminPanel');
	}
);

//read item
router.get('/items/:id', auth, async (req, res) => {
	const _id = req.params.id;

	try {
		const item = await Item.findOne({ _id, owner: req.user._id });

		if (!item) {
			req.flash('error', 'Item not found!');
			return res.status(404).redirect('/adminPanel');
		}

		res.render('admin-editItem', {
			item
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/items');
	}
});

// GET /items?category=cap
// GET /items?limit=10&skip=10
// GET /items?sortBy=price:desc

//read items
router.get('/items', async (req, res) => {
	const itemCategories = await Item.find({});
	const pagination = req.query.pagination ? parseInt(req.query.pagination) : 9;
	const page = req.query.page ? parseInt(req.query.page) : 1;
	let totalDocuments;

	try {
		if (req.query.category) {
			items = await Item.find({ category: req.query.category })
				.limit(pagination)
				.skip((page - 1) * pagination)
				.sort({ createdAt: -1 });

			totalDocuments = await Item.find({ category: req.query.category }).countDocuments();
		} else {
			items = await Item.find({}).limit(pagination).skip((page - 1) * pagination).sort({ createdAt: -1 });

			totalDocuments = await Item.estimatedDocumentCount();
		}

		let total = Math.ceil(totalDocuments / pagination);
		const totalPages = Array(total).fill().map((e, i) => i + 1);

		const allCategories = [];

		itemCategories.forEach(function(item) {
			allCategories.push(item.category);
		});

		const uniqueCategories = allCategories.filter(function(elem, index, self) {
			return index == self.indexOf(elem);
		});
		res.render('items', {
			items,
			categories: uniqueCategories,
			totalPages,
			page,
			total,
			category: req.query.category
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/');
	}
});

// update item image
router.patch(
	'/items/itemPic/:id',
	auth,
	upload.single('itemPic'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

		try {
			const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });

			if (!item) {
				req.flash('error', 'Item not found!');
				return res.status(404).redirect('/items');
			}

			item.itemPic = buffer;

			await item.save();
			req.flash('success', 'Successfully updated item image');
			res.redirect('/items/' + req.params.id);
		} catch (e) {
			req.flash('error', 'Something went wrong!');
			res.status(400).redirect('/items');
		}
	},
	(error, req, res, next) => {
		req.flash('error', error.message);
		res.status(400).redirect('/items/' + req.params.id);
	}
);

// update item
router.patch('/items/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = [ 'name', 'price', 'category' ];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		req.flash('error', 'Invalid updates!');
		return res.status(400).redirect('/items');
	}

	try {
		const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });

		if (!item) {
			req.flash('error', 'Item not found!');
			return res.status(404).redirect('/items');
		}

		updates.forEach((update) => (item[update] = req.body[update]));

		await item.save();

		req.flash('success', 'Successfully updated item.');
		res.redirect('/items');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(400).redirect('/items');
	}
});

//delete item
router.delete('/items/:id', auth, async (req, res) => {
	try {
		const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

		if (!item) {
			req.flash('error', 'Item not found!');
			return res.status(404).redirect('/items');
		}

		req.flash('success', 'Successfully deleted item!');
		res.redirect('/items');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/items');
	}
});

router.get('/items/:id/itemPic', async (req, res) => {
	try {
		const item = await Item.findById(req.params.id);

		res.set('Content-Type', 'image/png');
		res.send(item.itemPic);
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/items');
	}
});

module.exports = router;
