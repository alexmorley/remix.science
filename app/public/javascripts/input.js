"use strict"

var inputDiv = document.getElementById('input');

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
      info.log("Server reached and return error in GET request", 1)
    }
  };

  request.onerror = function() {
    info.log("Connection Error in GET request")
  };

  request.send(); 
}
