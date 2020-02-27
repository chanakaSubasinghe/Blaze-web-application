const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Carousel = require('../models/carousel');
const router = new express.Router();

//create user
router.post('/users', async (req, res) => {
	try {
		const user = new User(req.body);

		await user.save();

		const token = await user.generateAuthToken();

		// res.cookie('auth_token', token, { secure: true, expires: new Date(Date.now() + 5000), httpOnly: true });
		res.cookie('auth_token', token);

		res.status(201).send(user);
	} catch (e) {
		res.status(400).send(e);
	}
});

// user login route
router.post('/login', async (req, res) => {
	try {
		const userQ = await User.findByCredentials(req.body.email, req.body.password);
		const token = await userQ.generateAuthToken();

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

		if (!user) {
			req.flash('error', 'No user found!');
			return res.redirect('/');
		}

		// res.cookie('auth_token', token, { expires: new Date(Date.now() + 5000), httpOnly: true });
		res.cookie('auth_token', token);

		req.flash('success', 'Successfully loggedIn');
		res.status(200).redirect('/adminPanel');
	} catch (e) {
		req.flash('error', e.message);
		res.status(400).redirect('/login');
	}
});

//logout user
router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});

		delete req.session.user;

		res.clearCookie('auth_token');

		await req.user.save();

		req.flash('success', 'Successfully loggedOut.');
		res.redirect('/');
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/');
	}
});

//logout all
router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];

		delete req.session.user;

		res.clearCookie('auth_token');

		await req.user.save();

		req.flash('success', 'Successfully logged out from all devices.');
		res.redirect('/');
	} catch (e) {
		req.flash('error', e.message);
		res.status(500).redirect('/');
	}
});

//read profile
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

//update user
router.patch('/users/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = [ 'password', 'newPassword', 'conNewPassword' ];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		req.flash('error', 'Invalid updates!');
		return res.status(400).redirect('/adminPanel');
	}

	if (req.body.newPassword !== req.body.conNewPassword) {
		req.flash('error', 'Your new password does not match confirmation!');
		return res.status(400).redirect('/adminPanel');
	}

	const isMatch = await bcrypt.compare(req.body.password, req.user.password);

	if (!isMatch) {
		req.flash('error', 'Your current password was incorrect!');
		return res.status(400).redirect('/adminPanel');
	}

	try {
		req.user.password = req.body.newPassword;
		await req.user.save();
		req.flash('success', 'Successfully updated password!');
		res.redirect('/adminPanel');
	} catch (e) {
		req.flash('error', e.message);
		res.status(400).redirect('/adminPanel');
	}
});

//delete user
// router.delete('/users/me', auth, async (req, res) => {
// 	try {
// 		await req.user.remove();

// 		res.send(req.user);
// 	} catch (e) {
// 		res.status(500).send();
// 	}
// });

//admin page
router.get('/adminPanel', auth, async (req, res) => {
	try {
		const carousels = await Carousel.find({});
		res.render('admin-panel', {
			carousels,
			user: req.user
		});
	} catch (e) {
		req.flash('error', 'Something went wrong!');
		res.status(500).redirect('/');
	}
});

//login page
router.get('/login', (req, res) => {
	if (!req.session.user) {
		res.render('login');
	} else {
		req.flash('error', 'You need to logout to login back!');
		res.redirect('/adminPanel');
	}
});

module.exports = router;
