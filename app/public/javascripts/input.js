"use strict"
const DEBUG = true;
if(DEBUG) {console.log("Found me");}

var inputDiv = document.getElementById('input');
if(DEBUG) {console.log(inputDiv);}

var dataFiles = [{filename:'/data/X.csv'},{filename: '/data/Y.csv'}]

//GETData(dataFiles[0].filename, (a,b) => showData(a,b,true));
//GETData(dataFiles[1].filename, showData);

function showData(data, data_id, clear=false) {
  if(data_id) {
    data = data_id + ": " + data;
  }
  var dataDiv = document.getElementById('inputdata');
  var dataList = document.createElement('ul');
  var nextListItem = document.createElement('li');
  var nextListText = document.createTextNode(data);
  nextListItem.appendChild(nextListText);
  dataList.appendChild(nextListItem);
  if(clear) {
    while (dataDiv.firstChild) {
      dataDiv.removeChild(dataDiv.firstChild);
    }
  }
  dataDiv.appendChild(dataList);
}

function GETData(url, cb) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      // Success!
      var resp = this.response;
      cb(resp,url);
    } else {
      // We reached our target server, but it returned an error

    }
  };

  request.onerror = function() {
    // There was a connection error of some sort
    if(DEBUG){console.log(this);}
  };

  request.send(); 
}
