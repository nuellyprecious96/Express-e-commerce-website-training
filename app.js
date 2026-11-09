
const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const MySQLStore = require('express-mysql-session')(session);

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//  options for sessions 
// MySQL session store configuration
const options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const sessionStore = new MySQLStore(options);

// Import routers
const authRoute = require('./routes/auth');
const adminRoute = require('./routes/admin');
const productRoute = require('./routes/product');
const pagesRoute = require('./routes/pages');
const pagesChockout = require('./routes/checkout');

// Configure Handlebars
app.engine(
    'handlebars',
    engine({
        defaultLayout: 'main',
        extname: '.handlebars',
        partialsDir: path.join(__dirname, 'views/partials'),

        helpers: {
            eq: function (a, b) {
                return String(a) === String(b);
            }
        }
    })
);

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//  session 
// Session middleware
app.use(session({
    key: 'ecommerce_session',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60
    }
}));

// Routes
app.use('/', pagesRoute);
app.use('/auth', authRoute);
app.use('/', adminRoute);
app.use('/', productRoute);
app.use('/', pagesChockout);

// Other pages
app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
