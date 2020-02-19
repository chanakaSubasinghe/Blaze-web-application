const mongoose = require('mongoose');

//connect to db
const databaseURL = process.env.MONGODB_URL;

mongoose.connect(databaseURL, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
});
