const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var fs = require('fs');
var PubNub = require('pubnub')
var app = express()

var https = require("https");
setInterval(function() {
    https.get("https://murmuring-bayou-68628.herokuapp.com/test");
}, 300000);

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
	fs.readFile('data.txt', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	    obj = JSON.parse(data); //now it an object
	    res.send(JSON.stringify(obj));
	}});	
})

app.get('/test', function (req, res) {
	/*
	fs.readFile('data.txt', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	    obj = JSON.parse(data); //now it an object
	    res.send(JSON.stringify(obj));
	}});*/

	res.send("200");

})

app.get('/input', function (req, res) 
{	var fs = require('fs');
	var faceid = req.query.faceid;
	var distance = req.query.distance;
	var breathing = req.query.breathing;
	fs.readFile('data.txt', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	    obj = JSON.parse(data); //now it an object
	    obj.faceid = parseInt(faceid);
	    obj.distance = parseInt(distance); //add some data
	    obj.breathing = parseInt(breathing); //add some data
	    json = JSON.stringify(obj); //convert it back to json
	    fs.writeFile('data.txt', json, 'utf8', null); // write it back
	    fs.readFile('alexa.txt', 'utf8', function readFileCallback(err, data){
		    if (err){
		        console.log(err);
		    } else {
		    obj = JSON.parse(data); //now it an object
		    json = JSON.stringify(obj); //convert it back to json
		    res.send(json) 
		}});
	}});
})

app.get('/alexa', function (req, res) 
{	var fs = require('fs');
	var alexa = 1;
	fs.readFile('alexa.txt', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	    obj = JSON.parse(data); //now it an object
	    obj.alexa = 1;
	    json = JSON.stringify(obj); //convert it back to json
	    fs.writeFile('alexa.txt', json, 'utf8', null); // write it back
		setTimeout(function() {
			//Reset back to lock mode after 10 seconds, enough for client side to unlock
			var obj = new Object()
		    obj.alexa = 0;
			json = JSON.stringify(obj); //convert it back to json
	    	fs.writeFile('alexa.txt', json, 'utf8', null); // write it back
		}, 5000);
	    res.send('success') 
	}});
})

app.get('/pubnub', function (req, res) 
{	

	var pubnub = new PubNub({
                            publishKey : 'YOUR_KEY',
                            subscribeKey : 'YOUR_KEY'
                        })
                                
                        var publishConfig = {
                            channel : "facelock",
                            message : {
                                title: "Face lock",
                                description: "Face lock is detecting unusual activity, click to see security cam."
                            }
                        };
                                                    pubnub.publish(publishConfig, function(status, response) {
                                    console.log(status, response);
                            });
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
