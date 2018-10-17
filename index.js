const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.set('view engine', 'twig');
app.use(bodyParser.urlencoded({ extended: false }));

const messages = [
    "howdy",
    "hey there",
    "new message",
    "new new message"
];

app.get('/', (req, res) => {
    // res.send('<h1>hello world!</h1>');
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
