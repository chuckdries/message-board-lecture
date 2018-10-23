const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const sqlite = require('sqlite');

app.set('view engine', 'twig');
app.use(bodyParser.urlencoded({ extended: false }));
app.disable('view cache');
const dbPromise = sqlite.open('./data.db');

app.get('/', async (req, res) => {
    const db = await dbPromise;
    const messages = await db.all('SELECT * FROM messages;');
    res.render('index', { messages });
});

app.post('/message', async (req, res) => {
    const db = await dbPromise;
    await db.run('INSERT INTO messages (author, message) VALUES (?, ?)', req.body.author, req.body.message);
    res.redirect('/');
})

app.use((req, res) => {
    res.status(404).send('file not found');
})

app.listen(3000);
console.log('listening on port 3000');
