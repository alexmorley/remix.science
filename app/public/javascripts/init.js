var statusDiv = document.getElementById('status');
var info = new Status(statusDiv, 3);
info.log("Status Bar Initialized", 3)

info.log("Initializing Nodes...", 3)
let proc_node = ProcessingNode('http://localhost:4240', '9e41fb432a38');
let local_kbucket_node = new KBucketNode('http://localhost:3000/kbucket','52260a0e4a6c')
let hub_node = new HubNode('http://localhost:3240')
info.log("Done.", 3)

let LocalDataStorage = {
  spec: undefined,
  input_content_cache: {},
  output_content_cache: {},
  nodes: {
    proc_node,
    local_kbucket_node,
    hub_node
  },
  runs: []
}
info.log("Initialized Local Data Storage", 3)
