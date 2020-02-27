const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
	try {
		// const token = req.header('Authorization').replace('Bearer ', '');

		// assigning auth cookie to a variable
		const token = req.cookies['auth_token'];
		// if (token) {

		// verifying that is it match with JWT token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// checking for valid user
		const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

		// if there is no user throw an error
		if (!user) {
			throw new Error();
		}

		// assigning variables to request
		req.token = token;
		req.user = user;
		// }
		next();
	} catch (e) {
		delete req.session.user;
		res.clearCookie('auth_token');

		req.flash('error', 'You need to be loggedIn to do that!'); // if there is an error throw an error
		res.status(401).redirect('/');
	}
};

module.exports = auth;
