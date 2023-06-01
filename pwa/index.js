// This file contains both application-specific code and utility helper
// routines. In general, this code would be organized in separate files and
// then amalgamated and minified in a deployment phase. In order to simplify
// the process of building a PWA, in this case everything is kept in one file.
// All code that pertains to the application is confined to the Application
// object at the end of the file.

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
// found. For example, if <span id="/page/42"> is defined in the DOM,
// then the call queryElement('id', '/page/42') will return that span
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

// This function returns a list of all input fields in the specified form that
// have the id attribute set. The return value is null if the form cannot be
// found.
formInputs = function(formName) {
  var formEl, inpList;

  inpList = null;
  formEl = document.querySelector('form[id="' + formName + '"]');
  if (formEl) {
    inpList = formEl.querySelectorAll('[name]');
  }
  return inpList;
};

// This function populates a named form (a form with the id attribute
// set) with values in an object. inputMap looks like { amount: "123.45", tax:
// false, ... }
formSet = function(formName, inputMap) {
  var j, inpEl, inpList, key, val;

  inpList = formInputs(formName);
  if (inpList) {
    for (j = 0; j < inpList.length; j++) {
      inpEl = inpList[j];
      key = inpEl.getAttribute('name');
      val = inputMap[key];
      if (!val) {
        val = '';
      }
      switch (inpEl.getAttribute('type')) {
        case 'number':
          // Convert from number to string
          inpEl.value = val.toFixed(2);
          break;
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
      key = inpEl.getAttribute('name');
      switch (inpEl.type) {
        case 'number':
          // Convert from string to number
          val = Number(inpEl.value);
          break;
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
// first matching element is treated as the parent element.
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

// Return a date object corresponding to current date plus dy days. dy should
// be negative for past dates.
daysAdd = function(dy) {
  var dt;
  dt = new Date();
  dt.setTime(dt.getTime() + dy * 86400000); // Number of milliseconds per day
  return dt;
};

// Return a standard date string (eg, '2006-01-02') corresponding to current
// date plus dy. dy should be negative for past dates.
strDaysAdd = function(dy) {
  return strDateToStdStr(daysAdd(dy));
};

// Return '2006-01-02' from a JavaScript date.
strDateToStdStr = function(dt) {
  return '' + dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
};

// The Application object contains all application-specific functions and data.
// Everything outside of is generic for all applications.
Application = function() {
  var thisApp, pageFnc, pageShow, pageShowPrev, action, tally, pageStk,
  sample, ledgerView;

  thisApp = this;
  tally = 0;

  // pageStk records the path of pages that have been shown so that the
  // currently displayed page is at the top of the stack. This facilitates the
  // 'return' action so previously displayed pages can be shown. The
  // operational difference with a stack is that when a page is shown that is
  // already on the stack, then the stack is unwound to that element rather
  // than being pushed.
  pageStk = [];

  // pageFnc is an object that maps a page name to a function that is called
  // before that page is displayed. It provides an opportunity to modify the
  // page's content before it is shown.
  pageFnc = {};

  // sample defines the principal data structure used in this application
  sample = {
    "name": "Bank of Whoville / Checking",
    "balance_start": 0,
    "rows": [
      {
        'date': '2022-09-01',
        'transactee': 'Whoville Hardware',
        'checknum': '4021',
        'amount': 48,
        'comment': 'Horseshoes and nails',
        'reconciled': false,
        'void': false
      },
      {
        'date': '2022-09-01',
        'transactee': 'Bank of Whoville',
        'checknum': '',
        'amount': 120.5,
        'comment': 'Sale of alfalfa',
        'reconciled': false,
        'void': false
      },
      {
        'date': '2022-09-01',
        'transactee': 'Whoville Grains',
        'checknum': '4022',
        'amount': 27.5,
        'comment': 'Rye seed',
        'reconciled': false,
        'void': false
      }
    ]
  };

  ledgerView = function(data) {
    var el, hdrEl, recEl, j, dot, icon, bank, actual, rec, elList, list;
    icon = '►';
    dot = ' · ';
    bank = data.rows.balance_start || 0;
    actual = data.rows.balance_start || 0;
    data.rows.sort(function(a, b) {
      var cmp;
      if (a.date === b.date) {
        cmp = 0;
      } else if (a.date < b.date) {
        cmp = -1;
      } else {
        cmp = 1;
      }
    });
    list = [];
    for (j = 0; j < data.rows.length; j++) {
      rec = data.rows[j];
      if (! rec['void']) {
        actual += rec.amount;
        if (rec.reconciled) {
          bank += rec.amount;
        }
      }
      rec.bank = bank;
      rec.actual = actual;
      rec.pos = j;
      // console.log('rec', rec);
      list.push(rec);
    }

    el = queryElement('id', 'ledger');
    removeAllChildren(el);

    el.appendChild(html('div', {},
      html('div', {}, 'Edit'),
      html('div', {}, 'Transaction'),
      html('div', {}, 'Amount'),
      html('div', {}, 'Bank')
    ));

    for (j = data.rows.length; j > 0; j--) {
      rec = list[j - 1];
      el.appendChild(html('div', {},
        html('div', { 'data-show': '/form/ledger|' + rec.pos }, icon),
        html('div', {}, rec.date, dot, rec.comment, html('br', {}), rec.actual.toFixed(2)),
        html('div', {}, rec.amount.toFixed(2)),
        html('div', {}, rec.bank.toFixed(2))
      ));
    }

    // console.log('el', el);
    // return html('div', {}, elList);
  };

  pageFnc['/page/ledger'] = function(list) {
    var el;
    el = queryElement('id', 'ledger');
    if (el) {
      // el.innerText = new Date().toString();
      // setChild(el, ledgerView(sample));
      ledgerView(sample);
    }
  };

  pageFnc['/page/form'] = function(list) {
    // console.log('sample values', sample.rows[0]);
    formSet('transaction', sample.rows[0]);
    // console.log('form values', formGet('transaction'));
  };

  pageShowPrev = function() {
    var pg;

    if (pageStk.length > 1) {
      pageStk.pop();
      pg = pageStk.pop();
      pageShow(pg.name, pg.list);
    }
  };

  action = function(name, list) {
    switch (name) {
      case 'inc':
        tally += Number(list[0]);
        setText('#tally', tally);
        break;
      case 'return':
        pageShowPrev();
        break;
      case '/form/save':
        // TODO save form values before returning
        pageShowPrev();
        break;
    }
  };

  // Display the specified page and hide all of its siblings. If a pre-display
  // function is defined for the page, show it before making the page visible.
  pageShow = function(name, list) {
    var fnc, j, popCount, el, show;

    el = queryElement('data-page', name);
    if (el) {
      fnc = pageFnc[name];
      if (fnc) {
        fnc(list);
      }
      // If the page to be shown is already on the page stack, truncate the
      // stack to that point
      for (popCount = 0, j = 0; (j < pageStk.length) && (0 === popCount); j++) {
        if (name === pageStk[j].name) {
          popCount = pageStk.length - j;
        }
      }
      for (j = 0; j < popCount; j++) {
        pageStk.pop();
      }
      pageStk.push({ name: name, list: list });
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
