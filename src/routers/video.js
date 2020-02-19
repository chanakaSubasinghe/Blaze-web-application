const express = require('express');
const Video = require('../models/video');
const auth = require('../middleware/auth');
const router = new express.Router();

//create video link
router.post('/gallery/videos', auth, async (req, res) => {
	try {
		const videoURL = req.body.videoID;

		function YouTubeGetID(url) {
			var ID = '';
			url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
			if (url[2] !== undefined) {
				ID = url[2].split(/[^0-9a-z_\-]/i);
				ID = ID[0];
			} else {
				ID = url;
			}
			return ID;
		}

		const video = new Video({
			title: req.body.title,
			videoID: YouTubeGetID(videoURL),
			owner: req.user._id
		});

		await video.save();

		req.flash('success', 'Successfully added video.');
		res.redirect('/adminPanel');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(400).redirect('/adminPanel');
	}
});

//read video
router.get('/gallery/videos/:id', auth, async (req, res) => {
	const _id = req.params.id;

	try {
		const video = await Video.findOne({ _id, owner: req.user._id });

		if (!video) {
			req.flash('error', 'Video not found!');
			return res.status(404).redirect('/gallery/videos');
		}

		res.render('admin-editVideo', {
			video
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/gallery/videos');
	}
});

//read videos
router.get('/gallery/videos', async (req, res) => {
	try {
		const pagination = req.query.pagination ? parseInt(req.query.pagination) : 9;
		const page = req.query.page ? parseInt(req.query.page) : 1;
		const totalDocuments = await Video.estimatedDocumentCount();

		let total = Math.ceil(totalDocuments / pagination);
		const totalPages = Array(total).fill().map((e, i) => i + 1);

		const videos = await Video.find({}).limit(pagination).skip((page - 1) * pagination).sort({ createdAt: -1 });

		// await req.user
		// 	.populate({
		// 		path: 'videos'
		// 	})
		// 	.execPopulate();

		res.render('video', {
			videos,
			totalPages,
			page,
			total
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/');
	}
});

//update video
router.patch('/gallery/videos/:id', auth, async (req, res) => {
	function YouTubeGetID(url) {
		var ID = '';
		url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
		if (url[2] !== undefined) {
			ID = url[2].split(/[^0-9a-z_\-]/i);
			ID = ID[0];
		} else {
			ID = url;
		}
		return ID;
	}

	req.body.videoID = YouTubeGetID(req.body.videoID);

	const updates = Object.keys(req.body);
	const allowedUpdates = [ 'title', 'videoID' ];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		req.flash('error', 'Invalid updates!');
		return res.status(400).redirect('/gallery/videos');
	}

	try {
		const video = await Video.findOne({ _id: req.params.id, owner: req.user._id });

		if (!video) {
			req.flash('error', 'Video not found!');
			return res.status(404).redirect('/gallery/videos');
		}

		updates.forEach((update) => (video[update] = req.body[update]));

		await video.save();

		req.flash('success', 'Successfully updated video.');
		res.redirect('/gallery/videos');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(400).redirect('/gallery/videos');
	}
});

//delete video
router.delete('/gallery/videos/:id', auth, async (req, res) => {
	try {
		const video = await Video.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

		if (!video) {
			req.flash('error', 'Video not found!');
			return res.status(404).redirect('/gallery/videos');
		}
		req.flash('success', 'Successfully deleted video.');
		res.redirect('/gallery/videos');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/gallery/videos');
	}
});

module.exports = router;
