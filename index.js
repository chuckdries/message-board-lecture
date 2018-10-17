const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.set('view engine', 'twig');
app.use(bodyParser.urlencoded({ extended: false }));
app.disable('view cache');

const messages = [
    "howdy",
    "hey there"
];

app.get('/', (req, res) => {
    res.render('index', { messages });
});

app.post('/message', (req, res) => {
    messages.push(req.body.message);
    res.redirect('/');
})

app.use((req, res) => {
    res.status(404).send('file not found');
})

app.listen(3000);
console.log('listening on port 3000');
