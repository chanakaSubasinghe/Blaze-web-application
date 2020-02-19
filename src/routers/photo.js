const express = require('express');
const Photo = require('../models/photo');
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
			return cb(new Error('please upload a image'));
		}
		cb(undefined, true);
	}
});

//create photo
router.post(
	'/gallery/photos',
	auth,
	upload.array('pic', 10),
	async (req, res) => {
		try {
			// const promises = req.files.map((file) => {
			// 	return sharp(file.buffer).resize({ width: 1280, height: 853 }).png().toBuffer();
			// });

			// const buffers = await Promise.all(promises);

			// const photos = buffers.map((buffer) => {
			// 	return new Photo({ pic: buffer, owner: req.user });
			// });

			// await Photo.insertMany(photos);

			for (let i = 0; i < req.files.length; i++) {
				const buffer = await sharp(req.files[i].buffer).resize({ width: 1280, height: 853 }).png().toBuffer();
				const photo = new Photo({
					pic: buffer,
					owner: req.user
				});

				await photo.save();
			}

			req.flash('success', 'Successfully added.');
			res.redirect('/adminPanel');
		} catch (e) {
			req.flash('error', e.message);
			res.status(400).redirect('/adminPanel');
		}
	},
	(error, req, res, next) => {
		if (error.message === 'Unexpected field') {
			req.flash('error', 'Maximum 10 images please!');
			res.status(400).redirect('/adminPanel');
		} else {
			req.flash('error', error.message);
			res.status(400).redirect('/adminPanel');
		}
	}
);

//read photo
router.get('/gallery/photos/:id', auth, async (req, res) => {
	const _id = req.params.id;

	try {
		const photo = await Photo.findOne({ _id, owner: req.user._id });

		if (!photo) {
			req.flash('error', 'Photo not found!');
			return res.status(404).redirect('/gallery/photos');
		}

		res.render('admin-editPhoto', {
			photo
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/gallery/photos');
	}
});

//read all photos
router.get('/gallery/photos', async (req, res) => {
	try {
		const pagination = req.query.pagination ? parseInt(req.query.pagination) : 12;
		const page = req.query.page ? parseInt(req.query.page) : 1;
		const totalDocuments = await Photo.estimatedDocumentCount();

		let total = Math.ceil(totalDocuments / pagination);
		const totalPages = Array(total).fill().map((e, i) => i + 1);

		const photos = await Photo.find({}).limit(pagination).skip((page - 1) * pagination);

		res.render('photo', {
			photos,
			totalPages,
			page,
			total
		});
	} catch (e) {
		req.flash('error', e.message);
		res.status(500).redirect('/');
	}
});

//update photo
router.patch(
	'/gallery/photos/:id',
	auth,
	upload.single('pic'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer).resize({ width: 1280, height: 853 }).png().toBuffer();

		try {
			const photo = await Photo.findOne({ _id: req.params.id, owner: req.user._id });

			if (!photo) {
				req.flash('error', 'Photo not found!');
				return res.status(404).redirect('/gallery/photos');
			}

			photo.pic = buffer;

			await photo.save();

			req.flash('success', 'Successfully updated photo.');
			res.redirect('/gallery/photos');
		} catch (e) {
			req.flash('error', 'Something went wrong!');
			res.status(400).redirect('/gallery/photos');
		}
	},
	(error, req, res, next) => {
		req.flash('error', error.message);
		res.status(400).redirect('/gallery/photos');
	}
);

//delete photo
router.delete('/gallery/photos/:id', auth, async (req, res) => {
	try {
		const photo = await Photo.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

		if (!photo) {
			req.flash('error', 'Photo not found!');
			return res.status(404).redirect('/gallery/photos');
		}

		req.flash('success', 'Successfully deleted photo.');
		res.redirect('/gallery/photos');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/gallery/photos');
	}
});

router.get('/gallery/photos/:id/pic.png', async (req, res) => {
	try {
		const photo = await Photo.findById(req.params.id);

		res.set('Content-Type', 'image/png');
		res.send(photo.pic);
	} catch (e) {
		req.flash('error', 'Something went wrong');
		res.status(400).redirect('/gallery/photos');
	}
});

module.exports = router;
