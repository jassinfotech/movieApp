const express = require('express');
const app = express();
const port = 8000;
var bodyParser = require('body-parser');
var cors = require('cors')
const auth = require('./routes/auth');
const users = require('./routes/users');
app.use(cors())
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Start routes 
app.use('/auth', auth);
app.use('/users', users);
app.get('/', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.send('hello');
})

// Start te server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

