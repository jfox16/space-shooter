
const path = require('path');
const jsdom = require('jsdom');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

const { JSDOM } = jsdom;
const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();
 
app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

function setupAuthoritativePhaser() {
  JSDOM.fromFile(path.join(__dirname, 'server/index.html'), {
    // To run the scripts in the html file
    runScripts: "dangerously",
    // Also load supported external resources
    resources: "usable",
    // So requestAnimationFrame events fire
    pretendToBeVisual: true
  }).then((dom) => {
    dom.window.URL.createObjectURL = (blob) => {
      if (blob) {
        return parser.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
      }
    }
    dom.window.URL.revokeObjectURL = (objectURL) => {};
    dom.window.gameLoaded = () => {
      let port = process.env.PORT;
      if (!port) {
        port = 8082;
      }
      server.listen(port, function () {
        console.log(`Listening on ${server.address().port}`);
      });
    };
    dom.window.io = io;
  }).catch((error) => {
    console.log(error.message);
  });
}
 
setupAuthoritativePhaser();