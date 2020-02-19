const express = require('express');
const Carousel = require('../models/carousel');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();

// uploading image and validations

const upload = multer({
	// maximum size of an image
	limits: {
		fileSize: 1000000
	},

	fileFilter(req, file, cb) {
		// checking if file extension does not match with jpg,png,jpeg

		if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
			return cb(new Error('please upload a image')); // if it is then throw an error
		}
		cb(undefined, true);
	}
});

//create Carousel
router.post('/carousels', auth, upload.single('carouselPic'), async (req, res) => {
	try {
		// uploaded image resize with sharp and save it as a buffer
		const buffer = await sharp(req.file.buffer).resize({ width: 1600, height: 600 }).png().toBuffer();

		//create a new object
		const carousel = new Carousel({
			carouselPic: buffer,
			owner: req.user
		});

		// save it in the DB
		await carousel.save();

		//send the response
		res.send(carousel);
	} catch (e) {
		res.status(400).send(e); // throw an error if there are any errors
	}
});

//read photo
router.get('/carousels/:id', auth, async (req, res) => {
	try {
		// assigning url id to a variable
		const _id = req.params.id;

		// checking valid image
		const carousel = await Carousel.findOne({ _id, owner: req.user._id });

		// if invalid
		if (!carousel) {
			req.flash('error', 'Carousel not found!'); // throw an error
			return res.status(404).redirect('/adminPanel');
		}

		// if valid send the response with objects
		res.render('admin-editCarousel', {
			carousel
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!'); // throw an error if there are errors
		res.status(500).redirect('/adminPanel');
	}
});

//read all photos
// router.get('/carousels', async (req, res) => {
// 	try {
// 		const carousels = await Carousel.find({});

// 		res.render('admin-panel', {
// 			carousels,
// 			user: req.user
// 		});
// 	} catch (e) {}
// });

//update photo
router.patch(
	'/carousels/:id',
	auth,
	upload.single('carouselPic'),
	async (req, res) => {
		try {
			// resize with sharp and assign it in to a variable
			const buffer = await sharp(req.file.buffer).resize({ width: 1600, height: 600 }).png().toBuffer();

			// checking valid image with the user
			const carousel = await Carousel.findOne({ _id: req.params.id, owner: req.user._id });

			//if invalid
			if (!carousel) {
				req.flash('error', 'Carousel not found!'); // throw an error
				return res.status(404).redirect('/adminPanel');
			}

			// if valid save it in variable
			carousel.carouselPic = buffer;

			// save to DB
			await carousel.save();

			// throw a success message to user
			req.flash('success', 'Successfully updated carousel');
			res.redirect('/adminPanel');
		} catch (e) {
			req.flash('error', e.message); // throw an error if there are errors
			res.status(400).redirect('/adminPanel');
		}
	},
	(error, req, res, next) => {
		req.flash('error', error.message); // throw an error if there are errors
		res.status(400).redirect('/carousels/' + req.params.id);
	}
);

//delete photo
// router.delete('/carousels/:id', auth, async (req, res) => {
// 	try {
// 		const carousel = await Carousel.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

// 		if (!carousel) {
// 			req.flash('error', 'Carousel not found!');
// 			return res.redirect('back');
// 		}

// 		req.flash('success', 'Successfully deleted carousel');
// 		res.redirect('/adminPanel');
// 	} catch (e) {
// 		res.status(500).send(e);
// 	}
// });

// read image to hbs
router.get('/carousels/:id/pic.png', async (req, res) => {
	try {
		// check image with given id
		const carousel = await Carousel.findById(req.params.id);

		// response set to image/png
		res.set('Content-Type', 'image/png');

		//send response
		res.send(carousel.carouselPic);
	} catch (e) {
		req.flash('error', e.message); // throw an error
		res.status(500).redirect('/adminPanel');
	}
});

module.exports = router;
