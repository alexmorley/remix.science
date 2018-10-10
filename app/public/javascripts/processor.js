"use strict"

function ProcessingNode(lari_url, node_id) {
  function setup_json_api_call(type, endpoint, err, data) {
    // [TODO] add checks for inputs here
    var request = new XMLHttpRequest();
    request.open(type, lari_url+'/'+node_id+endpoint, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    // Setup our listener to process completed requests
    request.onload = function () {
      // Process our return data
      if (request.status >= 200 && request.status < 300) {
        // Runs when the request is successful
        data(request.responseText);
      } else {
        // Runs when it's not
        console.log("status: "+request.status);
        err(request.responseText);
      }
    }
    return request
  };
  return {
    lari_url,
    setup_json_api_call
  }
}

function update_spec_display(spec) {
  // map inputs to text boxes
  var parent_div = document.getElementById("spec_input");
  spec.inputs.forEach(function (el,i,arr) {
    let p = parent_div.appendChild(document.createElement('p'));
    p.innerHTML = 'Input File for ' + el.name + ':';
    
    let input = parent_div.appendChild(document.createElement('input'));
    input.value = '/data/' + el.default_file_name;
    input.onchange = function() {
      let i = this;
      console.log(i);
      GETData(i.value, function update_data(a,b) {
        let p
        if (i.nextSibling.tagName == 'DIV') {
          p = i.parentNode.insertBefore(document.createElement('p'), i.nextSibling.nextSibling);
        } else {
          p = i.nextSibling;
        }
        p.innerHTML = a; 
      });
    };
    input.onchange();
  
    var data = parent_div.appendChild(document.createElement('div'));

  });
  // map opts to text boxes
  //
  // map outputs to text boxes
  var parent_div = document.getElementById("spec_output");
  spec.outputs.forEach(function (el,i,arr) {
    let p = parent_div.appendChild(document.createElement('p'));
    p.innerHTML = 'Input File for ' + el.name + ':';
    
    let input = parent_div.appendChild(document.createElement('input'));
    input.value = '/data/' + el.default_file_name;
  });
}

var lari_url = 'http://localhost:4240';
var node_id  = '0f32ef79a70e';
var proc_node = ProcessingNode(lari_url, node_id);

var spec_button = document.getElementById("findprocessor");
spec_button.onclick = function cb(){
  var request = proc_node.setup_json_api_call('POST','/api/processor_spec',
      function on_error(err) { console.log(err); },
      function on_data(data) {
        var data_obj = JSON.parse(data);
        if (data_obj.spec) {
          console.log(data_obj.spec);
          update_spec_display(data_obj.spec);
        } else {
          console.log("Invalid Processor Spec");
        };
      });
  var processor_name = document.getElementById("processor_name").value;
  var data ={processor_name:processor_name, opts: {}};
  request.send(JSON.stringify(data));
};

if (false) {
  var run_button = document.getElementById("runprocessor");
  run_button.onclick = function cb(){
    var request = proc_node.setup_json_api_call('POST','/api/processor_spec',
        function on_error(err) { console.log(err); },
        function on_data(data) { console.log(data); })
      var processor_name = document.getElementById("processor_name").value;
    var data ={processor_name:processor_name, opts: {}};
    request.send(JSON.stringify(data));
  };
}
