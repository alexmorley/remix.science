async function get_input_data() {
  let processor_name = document.getElementById("processorlist").value;
  let input_els = document.getElementById("spec_input")
    .getElementsByTagName("input");
  let inputs = {};
  let input_arr = Array.from(input_els, async function a(o) {
    inputs[o.id] = await local_kbucket_node.get_prv_from_filename(o.value);
  });
  await Promise.all(input_arr);
  return inputs
}

let visualise_button = document.getElementById("visualise");
visualise_button.onclick = async function cb(){
  let X = LocalDataStorage.input_content_cache.X
    .split('\n')
    .filter(x=> x)[0]
    .split(',')
  let Y = LocalDataStorage.input_content_cache.Y
    .split('\n')
    .filter(x=> x)[0]
    .split(',')

  let values = Y.map(function (el,i,arr) {
    return {"Y": el, "X":X[i]}
  })

  var vlSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
    "description": "A simple bar chart with embedded data.",
    "data": {
      "values": values,
    },
    "mark": "point",
    "encoding": {
      "x": {"field": "X", "type": "quantitative"},
      "y": {"field": "Y", "type": "quantitative"}
    }
  }
  console.log(vlSpec);
  vegaEmbed("#visulisation-1", vlSpec);
}
