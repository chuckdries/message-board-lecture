//NOTE: this code currently does not work!
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const sqlite = require('sqlite');
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser');


app.set('view engine', 'twig');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.disable('view cache');
const saltRounds = 10;
const dbPromise = sqlite.open('./data.db');

dbPromise.then(async (db) => {
    await db.run('CREATE TABLE IF NOT EXISTS messages ( id INTEGER PRIMARY KEY, author STRING, message STRING );');
    await db.run('CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY, email STRING, passwordHash STRING );');
    await db.run('CREATE TABLE IF NOT EXISTS sessions ( id INTEGER PRIMARY KEY, userid INTEGER, sessionToken STRING );');
});

// TODO: separate requireLogin function
const authorize = async (req, res, next) => {
    // const { sessionToken } = req.cookies;
    const db = await dbPromise;
    const sessionToken = req.cookies.sessionToken;
    if(!sessionToken) {
        next();
        return;
    }
    const user = await db.get('SELECT users.email, users.id as id FROM sessions LEFT JOIN users ON sessions.userid = users.id WHERE sessionToken=?', sessionToken);
    if(!user) {
        next();
        return;
    }
    console.log('authenticated request from', user.email); // eslint-disable-line no-console
    req.user = user;
    next();
    return;
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.status(401).send('please log in');
        return;
    }
    next();
};

app.use(authorize);

app.get('/', async (req, res) => {
    const db = await dbPromise;
    const messages = await db.all('SELECT * FROM messages;');
    res.render('index', { messages, user: req.user });
});

app.post('/message', requireAuth, async (req, res) => {
    const db = await dbPromise;
    await db.run('INSERT INTO messages (author, message) VALUES (?, ?)', req.body.author, req.body.message);
    res.redirect('/');
});

app.post('/register', async (req, res) => {
    const db = await dbPromise;
    const passwordHash = await bcrypt.hash(req.body.password, saltRounds);
    await db.run('INSERT INTO users (email, passwordHash)  VALUES (?, ?);', req.body.email, passwordHash);
    const users = await db.all('SELECT * FROM users');
    console.log('user registered', users[users.length-1].email); // eslint-disable-line no-console
    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const db = await dbPromise;
    const user = await db.get('SELECT * FROM users WHERE email=?', req.body.email);
    if (!user) {
        res.status(401).send('email or password is incorrect');
        return;
    }
    const passwordMatches = await bcrypt.compare(req.body.password, user.passwordHash);
    if (passwordMatches) {
        const sessionToken = uuidv4();
        await db.run('INSERT INTO sessions (userid, sessionToken) VALUES (?, ?);', user.id, sessionToken);
        res.cookie('sessionToken', sessionToken);
        res.redirect('/');
    } else {
        res.status(401).send('email or password is incorrect');
    }
});

app.get('/logout', async (req, res) => {
    const db = await dbPromise;
    res.cookie('sessionToken', '', { maxAge: 0 });
    await db.run('DELETE FROM sessions WHERE sessionToken=?', req.cookies.sessionToken);
    res.redirect('/');
});

app.get('/databasedump', async (req, res) => {
    const db = await dbPromise;
    const tables = await db.all('SELECT name FROM sqlite_master WHERE type="table"');
    const users = await db.all('SELECT * FROM users');
    const messages = await db.all('SELECT * FROM messages');
    const sessions = await db.all('SELECT * FROM sessions');
    res.json({
        tables,
        users,
        messages,
        sessions
    });
});

app.use((req, res) => {
    res.status(404).send('file not found');
});

app.listen(3000);
console.log('listening on port 3000'); // eslint-disable-line no-console
