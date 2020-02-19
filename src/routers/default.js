const express = require('express');
const router = express.Router();
const Carousel = require('../models/carousel');

//home route
router.get('/', async (req, res) => {
	// fetching carousel images
	const carousels = await Carousel.find({});

	// send the response
	res.render('index', {
		carousel1: carousels[0],
		carousel2: carousels[1],
		carousel3: carousels[2]
	});
});

//Achievement and events list Page
router.get('/achievements', (req, res) => {
	//send the response page
	res.render('achievements');
});

//contact us page
router.get('/contact-us', (req, res) => {
	// assigning serviceType(query) to a variable
	const serviceType = req.query.st;

	// send the response
	res.render('contact-us', {
		serviceType
	});
});

module.exports = router;
