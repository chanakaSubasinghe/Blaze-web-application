const express = require('express');
const { sendWelcomeEmail, sendBlazeEmail } = require('../emails/welcomeEmail');
const router = new express.Router();

//create client
router.post('/clients', async (req, res) => {
	try {
		// send reply to client
		sendWelcomeEmail(req.body.email, req.body.fullName);

		// send client message to Blaze team
		sendBlazeEmail(
			req.body.fullName,
			req.body.contactNumber,
			req.body.email,
			req.body.serviceType,
			req.body.message
		);

		// send a success message to client
		req.flash('success', 'Thank you ' + req.body.fullName + ' for your email. we will catch you up shortly.');
		res.status(201).redirect('/contact-us');
	} catch (e) {
		req.flash('error', 'Something went wrong, Please try again shortly!'); // throw an error to user
		res.status(400).redirect('/');
	}
});

module.exports = router;
