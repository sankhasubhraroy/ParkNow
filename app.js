require("dotenv").config();
const express = require("express");
const path = require("path")
const hbs = require("hbs");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();

const publicDirectory = path.join(__dirname, './public');
const partialsDirectory = path.join(__dirname, './partials');

app.use(express.static(publicDirectory));
// ParseURL-Extended bodie (as sent by HTML Forms)
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');
hbs.registerPartials(partialsDirectory);

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(port, () => {
    console.log("Server started at port:", port);
});
