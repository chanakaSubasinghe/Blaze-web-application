const express = require('express');
const path = require('path');
const hbs = require('hbs');
require('./db/mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');

const app = express();

// creating a session for store flash messages
app.use(cookieParser());
app.use(
	session({
		saveUninitialized: true,
		resave: false,
		secret: 'secret'
	})
);

// using flash for the application
app.use(flash()); // for success and error messages

//method-override
app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: true })); // passing data from req.body
app.use(express.json()); // using json for whole application
app.use(cookieParser()); // using cookie for store user token

//define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');
const viewPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

//Setup handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', viewPath);
hbs.registerPartials(partialsPath);

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// FOR APPLICATION DEVELOPING

app.use((req, res, next) => {
	res.render('upgrading');
});

// save user messages logged ii user in a session variables
app.use((req, res, next) => {
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	res.locals.user = req.session.user; // save user to the session
	next();
});

//handlebar handling for check length of success or error messages
hbs.registerHelper('checklength', function(v1, v2, options) {
	'use strict';

	// condition
	if (v1 && v1.length > v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

// assigning all routes to variables

const userRouter = require('./routers/user');
const itemRouter = require('./routers/item');
const clientRouter = require('./routers/client');
const defaultRouter = require('./routers/default');
const videoRouter = require('./routers/video');
const photoRouter = require('./routers/photo');
const carouselRouter = require('./routers/carousel');

// calling all routes

app.use(userRouter);
app.use(itemRouter);
app.use(clientRouter);
app.use(defaultRouter);
app.use(videoRouter);
app.use(photoRouter);
app.use(carouselRouter);

// assigning to env PORT to a variable
const port = process.env.PORT;

//port
app.listen(port, () => {
	console.log(`Server is up on ${port}`);
});
