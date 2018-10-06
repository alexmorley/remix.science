"use strict"

var lari_url = 'http://localhost:4240'
var node_id  = 

// Test API
var request = new XMLHttpRequest();
request.open('POST', lari_url+'/'+node_id+'/api/processor_spec', true);
request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

// Setup our listener to process completed requests
request.onload = function () {
	// Process our return data
	if (request.status >= 200 && request.status < 300) {
		// Runs when the request is successful
		console.log(request.responseText);
	} else {
		// Runs when it's not
		console.log("status: "+request.status);
		console.log(request.responseText);
	}

};

var data ={processor_name: "hello.world", opts: {}};
console.log(data);
request.send(JSON.stringify(data));

var run_button = document.getElementById("runprocessor");

run_button.onclick = function cb(){


};
