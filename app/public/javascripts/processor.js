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
        info.log("status: "+request.status);
        reject(request.responseText);
      }
    }
    request.send({});
  });
}

function make_json_api_call(data, type, endpoint) {
  return new Promise(function (resolve,reject) {
    // [TODO] add checks for inputs here
    info.log(type + ' ', this.url+'/'+this.id+endpoint, 3);
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
        info.log("status: "+request.status, 3);
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

function clear_collection(collection) {
  while(collection.length > 0) {
    collection[0].remove();
  }
}

function update_spec_display(spec) {
  let spec_input_div = document.getElementById("spec_input");
  clear_collection(spec_input_div.children);
  let spec_output_div = document.getElementById("spec_output");
  clear_collection(spec_output_div.children);
 
  // map inputs to text boxes
  spec.inputs.forEach(function (el,i,arr) {
    let p = spec_input_div.appendChild(document.createElement('p'));
    p.innerHTML = 'Input File for ' + el.name + ':';
    let input = spec_input_div.appendChild(document.createElement('input'));
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
        LocalDataStorage.input_content_cache[input.id] = a;
      });
    };
    input.onchange();
    let data = spec_input_div.appendChild(document.createElement('div'));
  });
  // map opts to text boxes
  let spec_params_div = document.getElementById("spec_params");
  spec.parameters.forEach(function (el,i,arr) {
    let p = spec_params_div.appendChild(document.createElement('p'));
    p.innerHTML = el.name + ':';
    let input = spec_params_div.appendChild(document.createElement('input'));
    input.value = el.default;
    input.id = el.name;
  });


  // map outputs to text boxes
  spec.outputs.forEach(function (el,i,arr) {
    let p = spec_output_div.appendChild(document.createElement('p'));
    p.innerHTML = 'Output File for ' + el.name + ':';

    let input = spec_output_div.appendChild(document.createElement('input'));
    input.value = el.default_file_name;
    input.id = el.name;
  });
}

let list_button = document.getElementById("listprocessors");
list_button.onclick = list_processors;  

let processor_list = document.getElementById("processorlist");
function list_processors(){
  let p = proc_node.make_json_api_call({opts:{}}, 'POST','/api/list_processors')
    .then(
      function (data) {
        clear_collection(processor_list.children)
        data.info.forEach(function map(el,i,arr) {
          let p = processor_list.appendChild(document.createElement('option'));
          p.innerHTML = el;
          p.value = el; 
        })},
      function (err) {
        info.log("Error from Lari: "+err, 1);
      }
    )
}
processor_list.onchange = findprocessor;

let spec_button = document.getElementById("findprocessor");
spec_button.onclick = findprocessor;

function findprocessor(){
  let processor_name = document.getElementById("processorlist").value;
  let data ={processor_name:processor_name, opts: {}};
  let p = proc_node.make_json_api_call(data, 'POST','/api/processor_spec')
    .then(
        function (data) {
          if (data.spec) {
            info.log("Updating Processor Spec",2)
            info.log(JSON.stringify(data.spec, null, "\n"), 2)
            update_spec_display(data.spec);
            LocalDataStorage.spec = data.spec;
          } else {
            info.log("Invalid Processor Spec",1);
            info.log(data, 2);
          }
        });
};

let run_button = document.getElementById("runprocessor");
run_button.onclick = async function cb(){
  let run = {
    startedAt: Date(Date.now()),
    status: "Collecting Inputs"
  }

  // Collect the data needed to send
  let processor_name = document.getElementById("processorlist").value;
  let input_els = document.getElementById("spec_input")
    .getElementsByTagName("input");
  let inputs = {};
  let input_arr = Array.from(input_els, async function a(o) {
    inputs[o.id] = await local_kbucket_node.get_prv_from_filename(o.value);
  });
  await Promise.all(input_arr);
  info.log(JSON.stringify(inputs,null,"\n"),3)
  
  let output_els = document.getElementById("spec_output")
    .getElementsByTagName("input");
  let outputs = {};
  let output_arr = Array.from(output_els, function a(o) {
    outputs[o.id] = o.value;
  });

  let params_els = document.getElementById("spec_params")
    .getElementsByTagName("input");
  let params = {};
  let params_arr = Array.from(params_els, function a(o) {
    params[o.id] = o.value;
  });

  let data ={
    processor_name:processor_name,
    inputs: inputs,
    outputs: outputs,
    opts: params,
    parameters: params
  };

  // Set up and make the API request
  run.spec = data;
  run.status = "Ready to send."
  let request = proc_node.make_json_api_call(data, 'POST','/api/run_process/')
    .then(
      function (data) {
        run.status = "Running..."
        return probe_process(data)
      })
    .then(
      function res(d) {
        // TODO expand to all results
        run.status = "Waiting for results";
        let sha1 = d.result.original_checksum;
        return hub_node.make_json_api_call({}, 'GET', 'find/'+sha1)
      },
      function rej(v) {
        info.log("Something went wrong with the process.", 1);
        run.status = "failed";
        throw v;
      })
    .then(
      function res(d) {
        run.status = "Pulling results from Kbucket"
        return get_url(d.urls[0])          
      },
      function rej(v) {
        info.log("error getting file path", 1);
        run.status = "failed";
        throw v
      }
    )
    .then(
      function res(d) {
        run.status = "suceeded";
        let result = d.split('\n')
          .map(arr=>arr.split(','));
        let result_table = createTable(result);
        document.getElementById('output')
          .appendChild(result_table);
      },
      function rej(v) {
        info.log("error downloading file", 1);
        run.status = "failed";
        throw v
      }
    )
    .catch(
      function error(err) {
        run.status = "failed";
        info.log(err,1);
      }
    )
    .finally(
      function res() {
        LocalDataStorage.runs.push(run)
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
                        info.log("Process Finished. Files available.", 3);
                        clearInterval(timer);
                        resolve(process.result.outputs);
                      } else {
                        info.log(process,2);
                        info.log("Waiting for files to be available",2);
                      }
                    } else {
                      info.log("Waiting for process to finish",2);
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
