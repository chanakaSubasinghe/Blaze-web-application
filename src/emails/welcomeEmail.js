const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// A reply for client when client sent a message

const sendWelcomeEmail = (email, fullName) => {
	sgMail.send({
		to: email,
		// from: 'blazebbx.entertainment@gmail.com', //Blaze ---
		from: 'gotukolamalluma@gmail.com',
		subject: 'Thanks for your email.',
		html: `<!DOCTYPE html>
                <html>
                <body>
					<p>Hello! ${fullName},</p>
					<p>Thank you for reaching out!</p>
					<p>We are currently in the middle of our busy season so our reply may be delayed up to three days. We
					appreciate your patience while we look into this for you!</p>
					<p>Thank you,</p>
					<p>Blaze team</p>
                </body>
                </html>`
	});
};

// To Blaze team from the client

const sendBlazeEmail = (fullName, contactNumber, email, serviceType, message) => {
	sgMail.send({
		to: 'gotukolamalluma@gmail.com',
		from: email,
		subject: serviceType,
		html: `<!DOCTYPE html>
                <html>
                <body>
					<p>Full name: ${fullName}</p>
					<p>Service Type: ${serviceType}</p>
					<p>Email: ${email}</p>
					<p>Contact number: ${contactNumber}</p>
					<p>Message: ${message}</p>
                </body>
                </html>`
	});
};

module.exports = {
	sendWelcomeEmail,
	sendBlazeEmail
};
