var express = require('express');
var app = express();

app.use('/static', express.static(__dirname + '/static'));

var http = require('http').Server(app); //serve the express

var io = require('socket.io')(http); //io is input and output

http.listen(8080, function() {
    console.log('app listening on port 8080.');
});

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost/mydata');
mongoose.connect("mongodb://lyricliu:lyc123456@ds153719.mlab.com:53719/heroku_lkd8k70c");


var TodoSchema = new mongoose.Schema({
  city: String,
  country: String,
  updated_at: { type: Date, default: Date.now },
});
// Create a model based on the schema
var Todo = mongoose.model('Todo', TodoSchema);

var getCoord = function(locationName, callback) {
    var https = require('https');
    var key = 'AIzaSyB0fra7B-r4Eaf1znubMEe_-wr93QZzNno';
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + city + '&key=' + key;
    https.get(url, function(response) {
        var dataString = '';

        response.setEncoding('utf-8');
        response.on('data', function(chunk) {
            dataString += chunk;
        });

        response.on('end', function() {
            var data = JSON.parse(dataString);
            if (data.results[0]) {
                if(data.results[0].address_components){
                  for(var i=0; i < data.results[0].address_components.length; i++){
                    if (data.results[0].address_components[i].types[0] === "country"){
                      var location = data.results[0].address_components[i].long_name;
                    }else{
                      var location = "unknown";
                    }
                  }
                }else{
                  var location = "unknown"
                }
                callback(location);
            };
        });
    });
}

var city;
var country;

// Todo.remove(function (err, todos) {
//    if (err) return console.error(err);
//    console.log(todos)
//  });

io.on('connection', function (socket) {
  socket.on('mycity', function (data) {
    //console.log(data);
    city = data.city;
    getCoord(city, function(coord) {
    //console.log(coord);
    country = coord;
    //console.log(country);
    var todo = new Todo({city: city, country: country});
    todo.save(function(err){
        if(err) console.log(err);
        else
            Todo.find(function (err,todos){
                if(err) return console.error(err);
                console.log("the city is saved: " + todos);
            });
        //console.log("the city" + todo.city);
    })
    socket.emit('country', { country: country });
    });
  });
});





app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
});
