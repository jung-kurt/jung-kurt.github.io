// This function creates a DOM element. It simplifies the task of generating
// structured HTML. The first argument is a node type, eg, 'p' or 'a'. The
// second argument is an object that specifies attributes to be applied to the
// newly created element, eg, { href="/page/1" }. Subsequent arguments are
// strings, elements or arrays of the same. In practice, calling html() as an
// argument facilitates the construction of nested DOM elements.
//
// html('p', {}, 'Hello') ->
// <p>Hello</p>
//
// html('p', { class: 'active' }, 'Hello') ->
// <p class="active">Hello</p>
//
// html('p', {}, 'Click ', html('a', { href: "#foo" }, 'here'), '!') ->
// <p>Click <a href="#foo">here</a>!</p>
//
// This function is adapted from https://github.com/joestelmach/laconic by Joe
// Stelmach, MIT license
html = function() {
  var j, k, attr, key, val, el, arg, argAppend;

  // First argument is tag name, eg 'p' or 'div'
  el = document.createElement(arguments[0]);

  // Second argument is attribute object, eg { href: "#foo" }
  attr = arguments[1];
  for (key in attr) {
    if (attr.hasOwnProperty(key)) {
      val = attr[key];
      if ((val !== null) && (val !== undefined)) {
        if (key === 'display') {
          el.style.display = val;
        } else if ((key === 'style') && (el.style.setAttribute)) {
          el.style.setAttribute('cssText', val);
        } else if (key === 'className') {
          el.className = (el.className.length > 0) ? el.className + ' ' + val : val;
        } else {
          el.setAttribute(key, val);
        }
      }
    }
  }

  argAppend = function(el, arg) {
    if (arg.nodeType !== 1) {
      // If arg isn't already a node, make it into a text node
      arg = document.createTextNode(arg);
    }
    el.appendChild(arg);
  };

  // Subsequent arguments are text, nodes, or arrays of arguments
  for (j = 2; j < arguments.length; j++) {
    arg = arguments[j];
    if (arg) {
      if (Object.prototype.toString.call(arg) === '[object Array]') {
        // arg is an array -- treat all elements as if they had been specified
        // as arguments
        for (k = 0; k < arg.length; k++) {
          argAppend(el, arg[k]);
        }
      } else {
        argAppend(el, arg);
      }
    }
  }

  return el;
};
