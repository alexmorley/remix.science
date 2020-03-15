// 0 silent
// 1 quiet
// 2 verbose
// 3 debug
function Status(el, reporting_level) {
  function log(msg, level=2) {
    if (level <= reporting_level) {
      var new_el = document.createElement('p');
      el.appendChild(new_el);
      new_el.innerHTML = msg;
    }
  }

  return {
    log
  }
}

