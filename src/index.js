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

//flash messages
app.use(cookieParser());
app.use(
	session({
		saveUninitialized: true,
		resave: false,
		secret: 'secret'
	})
);
app.use(flash());

//method-override
app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

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

// app.use((req, res, next) => {
// 	res.render('upgrading');
// });

// app.use(auth);

app.use((req, res, next) => {
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	res.locals.user = req.session.user;
	next();
});

//handlebar handling for check length of success or error messages
hbs.registerHelper('checklength', function(v1, v2, options) {
	'use strict';
	if (v1 && v1.length > v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

hbs.registerHelper('inc', function(value, options) {
	return parseInt(value) + 1;
	// return options.
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
