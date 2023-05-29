var bankShow, Application, queryElement, formSet, formGet, formInputs, html,
  removeAllChildren, elGet, setChild, setText, listenClick;

// This function listens to clicks at the document level. handlers is an object
// that maps attributes, eg, 'data-show', to a function that is called when the
// click initiator contains that that attribute. The function is called with
// the tokenized value of the attribute split with the '|' character.
//
// For example, consider handlers to be the object
//
//   { "data-show": fncShow, "data-action: fncAction }
//
// and the HTML to contain the element
//
//   <button data-show="/page/one|active|sum">Page 1</button>
//
// If this button is clicked, then fncShow('/page/one', ['active', 'sum']) is
// called.

listenClick = function(handlers) {
  // The click handler is set at the document level, rather than on the
  // initiator, to avoid garbage collection issues with event handlers.
  window.addEventListener('click', function(evt) {
    var key, el, val, handled, name;

    handled = false;
    el = evt.target; // Click initiator
    for (key in handlers) {
      if (handlers.hasOwnProperty(key)) {
        val = el.getAttribute(key);
        if (val) {
          val = val.split('|');
          name = val.shift();
          if (name) {
            handlers[key](name, val);
            handled = true;
          }
        }
      }
    }
    if (handled) {
      // Keep the browser from doing anything else with this event.
      evt.preventDefault();
    }
  });

};

// queryElement returns the first element encountered that has the specified
// attribute and value assigned. null is returned a matching element cannot be
// found. For example, if <span data-name="/page/42"> is defined in the DOM,
// then the call queryElement('data-name', '/page/42') will return that span
// element.
queryElement = function(attr, val) {
  return document.querySelector('[' + attr + '="' + val + '"]');
};

// Set target element as visible and each of its siblings as hidden. The
// specified element el is the target if rel is zero or missing. It is the
// previous or next sibling if rel is -1 or 1, respectively. The value for rel
// can be any integer. If the position of the element el plus rel exceeds the
// bounds of the sibling list it wraps. For example, the visibility of an
// element in a bank of two elements is toggled when rel is any odd number.
bankShow = function(el, rel) {
  var list, sib, pos, j;
  if (el) {
    list = el.parentNode.children;
    if ((list) && (list.length)) {
      pos = -1;
      for (j = 0; j < list.length && pos === -1; j++) {
        sib = list[j];
        if (sib.isEqualNode(el)) {
          pos = j;
        }
      }
      if (pos >= 0) {
        if (! rel) rel = 0;
        pos = (pos + rel) % list.length;
        for (j = 0; j < list.length; j++) {
          list[j].style.display = (j === pos) ? '' : 'none';
        }
      }
    }
  }
};

formInputs = function(formName) {
  var formEl, inpList;

  inpList = null;
  formEl = document.querySelector('form[data-name="' + formName + '"]');
  if (formEl) {
    inpList = formEl.querySelectorAll('[data-name]');
  }
  return inpList;
};

// This function populates a named form (a form with the data-name attribute
// set) with values in an object. inputMap looks like { amount: "123.45", tax:
// false, ... }
formSet = function(formName, inputMap) {
  var j, inpEl, inpList, key, val;

  inpList = formInputs(formName);
  if (inpList) {
    for (j = 0; j < inpList.length; j++) {
      inpEl = inpList[j];
      key = inpEl.getAttribute('data-name');
      val = inputMap[key];
      if (!val) {
        val = '';
      }
      switch (inpEl.getAttribute('type')) {
        case 'radio':
        case 'checkbox':
          inpEl.checked = !!val; // convert to boolean
          break;
        default:
          inpEl.value = val;
      }
    }
  } else {
    console.log('form not found', formName);
  }
};

// This function returns an object that maps input field names with their
// corresponding values for the form specified by formName.
formGet = function(formName) {
  var j, inpEl, inpList, key, val, form;

  form = {};
  inpList = formInputs(formName);
  if (inpList) {
    for (j = 0; j < inpList.length; j++) {
      inpEl = inpList[j];
      key = inpEl.getAttribute('data-name');
      switch (inpEl.type) {
        case 'file':
          val = inpEl;
          break;
        case 'radio':
        case 'checkbox':
          val = inpEl.checked;
          break;
        default:
          val = inpEl.value;
      }
      form[key] = val;
    }
  }
  return form;
};

// html() creates a DOM node.
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

// Return the element corresponding to el. If el is a string, it is assumed to
// be a selector. In this case, the first matching element is returned.
// Otherwise, el itself is returned.
elGet = function(el) {
  if (typeof el === 'string') {
    el = document.querySelector(el);
  }
  return el;
};

// Replace all children of the element specified by parent with the element
// specified by childEl. parent may be a selector string in which case the
// first matching element is teated as the parent element.
setChild = function(parent, childEl) {
  parent = elGet(parent);
  if (parent) {
    removeAllChildren(parent);
    parent.appendChild(childEl);
  }
};

// Set the inner text of the specified element. parent may be a selector string
// in which case the first matching element is teated as the parent element.
setText = function(el, str) {
  el = elGet(el);
  if (el) {
    el.innerText = str;
  }
};

// Remove all children of element el.
removeAllChildren = function(el) {
  if (el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
};

// The Application object contains all application-specific functions and data.
// Everything outside of is generic for all applications.
Application = function() {
  var thisApp, pageFnc, pageShow, action, tally;

  thisApp = this;
  tally = 0;

  // pageFnc is an object that maps a page name to a function that is called
  // before that page is displayed. It provides an opportunity to modify the
  // page's content before it is shown.
  pageFnc = {};

  pageFnc['/page/2'] = function(list) {
    var el;
    el = queryElement('data-name', 'time-load');
    if (el) {
      el.innerText = new Date().toString();
    }
  };

  pageFnc['/page/3'] = function(list) {
    var el;
    el = queryElement('data-name', 'previous');
    if (el) {
      if (list.length == 2) {
        el.innerText = list[0] + ' (' + list[1] + ')';
      }
    }
    setChild('#test', html('p', {}, 'This is a ', html('b', {}, 'test'), '.'));
  };

  action = function(name, list) {
    if (name === 'inc') {
      tally += Number(list[0]);
      setText('#tally', tally);
    }
  };

  // Display the specified page and hide all of its siblings. If a pre-display
  // function is defined for the page, show it before making it visible.
  pageShow = function(name, list) {
    var fnc, el;

    el = queryElement('data-page', name);
    if (el) {
      fnc = pageFnc[name];
      if (fnc) {
        fnc(list);
      }
      bankShow(el);
    }
  };

  // Listen to clicks on elements that have the 'data-show' and 'data-action'
  // attributes.
  listenClick({
    'data-show': pageShow,
    'data-action': action
  });

  // Display the home page to start.
  pageShow('/', []);

};

// Run the program
new Application();

// If you do not want to implement a progressive web app, remove the following
// block of code. In that case, the files manifest.json and service-worker.js
// can be removed from the deployed assets. One consequence of doing this is
// that users may be confused that the history stack and back key will not work
// as expected. Other than that, the application will function normally.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register('/pwa/service-worker.js');
}
