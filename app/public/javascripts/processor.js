"use strict"

function get_url(url) {
  return new Promise(function (resolve,reject) {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    // Setup our listener to process completed requests
    request.onload = function () {
      // Process our return data
      if (request.status >= 200 && request.status < 300) {
        // Runs when the request is successful
        resolve(request.responseText);
      } else {
        // Runs when it's not
        console.log("status: "+request.status);
        reject(request.responseText);
      }
    }
    request.send({});
  });
}

function make_json_api_call(data, type, endpoint) {
  return new Promise(function (resolve,reject) {
    // [TODO] add checks for inputs here
    if (DEBUG) {
      console.log(type + ' ', this.url+'/'+this.id+endpoint);
    }
    let request = new XMLHttpRequest();
    request.open(type, this.url+'/'+this.id+endpoint, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    // Setup our listener to process completed requests
    request.onload = function () {
      // Process our return data
      if (request.status >= 200 && request.status < 300) {
        // Runs when the request is successful
        resolve(JSON.parse(request.responseText));
      } else {
        // Runs when it's not
        console.log("status: "+request.status);
        reject(request.responseText);
      }
    }
    request.send(JSON.stringify(data));
  }.bind(this));
};

function HubNode(url, id='') {
  return {
    id,
    url,
    make_json_api_call
  }
}

function ProcessingNode(url, id) {
  return {
    id,
    url,
    make_json_api_call
  }
}

function KBucketNode(url,id) {
  function get_prv_from_filename(fname,cb) {
    return this.make_json_api_call({},'GET', '/prv'+'/'+fname)
  }

  return {
    url,
    id,
    make_json_api_call,
    get_prv_from_filename
  }
}

function update_spec_display(spec) {
  // map inputs to text boxes
  let parent_div = document.getElementById("spec_input");
  spec.inputs.forEach(function (el,i,arr) {
    let p = parent_div.appendChild(document.createElement('p'));
    p.innerHTML = 'Input File for ' + el.name + ':';

    let input = parent_div.appendChild(document.createElement('input'));
    input.value = el.default_file_name;
    input.id = el.name;
    input.onchange = function() {
      let i = this;
      GETData('/data/' + i.value, function update_data(a,b) {
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

    let data = parent_div.appendChild(document.createElement('div'));

  });
  // map opts to text boxes
  //
  // map outputs to text boxes
  parent_div = document.getElementById("spec_output");
  spec.outputs.forEach(function (el,i,arr) {
    let p = parent_div.appendChild(document.createElement('p'));
    p.innerHTML = 'Output File for ' + el.name + ':';

    let input = parent_div.appendChild(document.createElement('input'));
    input.value = el.default_file_name;
    input.id = el.name;
  });
}

let proc_node = ProcessingNode('http://localhost:4240', '0f32ef79a70e');
let local_kbucket_node = new KBucketNode('http://localhost:3000/kbucket', '5a9b54076ae0')
let hub_node = new HubNode('http://localhost:3240')

let list_button = document.getElementById("listprocessors");
list_button.onclick = function cb(){
  let p = proc_node.make_json_api_call({}, 'GET','/api/list_processors')
    .then(
        function (data) {
          console.log(data);
        },
        function (err) {
          console.log("Error from Lari: "+err);
        }
        );
}

let spec_button = document.getElementById("findprocessor");
spec_button.onclick = function cb(){
  let processor_name = document.getElementById("processor_name").value;
  let data ={processor_name:processor_name, opts: {}};
  let p = proc_node.make_json_api_call(data, 'POST','/api/processor_spec')
    .then(
        function (data) {
          if (data.spec) {
            update_spec_display(data.spec);
          } else {
            console.log("Invalid Processor Spec");
            console.log(data);
          }
        }
        );
};

let run_button = document.getElementById("runprocessor");
run_button.onclick = async function cb(){
  // Collect the data needed to send
  let processor_name = document.getElementById("processor_name").value;
  let input_els = document.getElementById("spec_input")
    .getElementsByTagName("input");
  let inputs = {};
  let input_arr = Array.from(input_els, async function a(o) {
    inputs[o.id] = await local_kbucket_node.get_prv_from_filename(o.value);
  });
  await Promise.all(input_arr);
  
  let output_els = document.getElementById("spec_output")
    .getElementsByTagName("input");
  let outputs = {};
  let output_arr = Array.from(output_els, function a(o) {
    outputs[o.id] = o.value;
  });

  /*let resPromise = local_kbucket_node.get_prv_from_filename('X.csv');
  let resPromise_obj = JSON.parse(await resPromise);
  console.log(resPromise_obj);

  resPromise.then(
      function on_res() { console.log("Promise Resolved"); },
      function on_rej() { console.log("Promise Rejected"); }
      );*/

  let data ={
    processor_name:processor_name,
    inputs: inputs,
    outputs: outputs,
    opts:{}
  };


  // Set up and make the API request
  let request = proc_node.make_json_api_call(data, 'POST','/api/run_process/')
    .then(
        function (data) {
          return probe_process(data)
        })
    .then(
        function res(d) {
          console.log("v from run");
          // TODO expand to all results
          let sha1 = d.result.original_checksum;
          return hub_node.make_json_api_call({}, 'GET', 'find/'+sha1)
        },
        function rej(v) {
          console.log("Something went wrong with the process.");
          throw v;
        })
    .then(
        function res(d) {
          return get_url(d.urls[0])          
        },
        function rej(v) {
          console.log("error getting file path");
          throw v
        }
        )
      .then(
          function res(d) {
            let result = d.split('\n')
                .map(arr=>arr.split(','));
						let result_table = createTable(result);
						document.getElementById('output')
              .appendChild(result_table);
          },
          function rej(v) {
            console.log("error downloading file");
            throw v
          }
          )

  // Continue to probe the server for the status of the process
  function probe_process(response) { 
    // set up a promise that resolves on process.is_complete
    return new Promise( function(resolve,reject) {
      if (response.success) {
        let timer = setInterval(poll, 3000);
        function poll() {
          let probe_data = {job_id:response.job_id,opts:{}}
          proc_node.make_json_api_call(probe_data, 'POST','/api/probe_process/')
              .then (
                  function on_data(data) {
                    let process = data;
                    if (process.is_complete) {
                      if (process.result.outputs) {
                        clearInterval(timer);
                        resolve(process.result.outputs);
                      } else {
                        console.log(process);
                        console.log("Waiting for files to be available");
                      }
                    } else {
                      console.log("Waiting for process to finish");
                    }
                  });
        }
      } else {
        reject("Probe Error Response: \n" + response);
      }
    });
  }
};

function createTable(data) {
  let table = document.createElement('table');
  let tableBody = document.createElement('tbody');

  data.forEach(function(rowData) {
    let row = document.createElement('tr');
    rowData.forEach(function(cellData) {
      let cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  return table.appendChild(tableBody);
}
