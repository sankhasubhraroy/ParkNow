require("dotenv").config();
const express = require("express");
const path = require("path")
const mysql = require("mysql");
const hbs = require("hbs");
const exp = require('constants');
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});


const publicDirectory = path.join(__dirname, './public');
const partialsDirectory = path.join(__dirname, './partials');

app.use(express.static(publicDirectory));
// ParseURL-Extended bodie (as sent by HTML Forms)
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');
hbs.registerPartials(partialsDirectory);

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("MYSQL Connected...")
    }
});

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(port, () => {
    console.log("Server Started at http://localhost:5000")
});
