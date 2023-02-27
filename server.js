const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('frontend'))
app.get('/', (req, res) => {
    res.send('Hello')
})

app.get('/reset', (req, res) => {
    io.emit('reset', req.query.channel)
    res.send("RESET")
})

app.get('/results', (req, res) => {
    io.emit('results', req.query.channel)
    res.send("RESULTS")
})

server.listen(8080, () => {
    console.log('listening on *:8080');
});

