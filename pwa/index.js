// This file contains both application-specific code and utility helper
// routines. In general, this code would be organized in separate files and
// then amalgamated and minified in a deployment phase. In order to simplify
// the process of building a PWA, in this case everything is kept in one file.
// All code that pertains to the application is confined to the Application
// object at the end of the file.

var bankShow, Application, queryElement, formSet, formGet, formInputs,
  removeAllChildren, elementNew, elGet, setChild, setText, listenClick,
  elementNewWrite, daysAdd, strDaysAdd, strDateToStdStr, removeSibs,
  attrMapLoad, elementRelative;

// Return object that associates names with elements that contain the specified
// attribute. If deep is true, then for each retrieved template, replace the
// element value with a deeply-cloned copy. If removeAttr is true, remove the
// specified attribute from the clone.
attrMapLoad = function(attr, deep, removeAttr) {
  var j, val, el, list, obj;

  obj = {};
  list = document.querySelectorAll('[' + attr + ']');
  for (j = 0; j < list.length; j++) {
    el = list[j];
    val = el.getAttribute(attr);
    if (deep) {
      el = el.cloneNode(true);
      if (removeAttr) {
        el.removeAttribute(attr);
      }
    }
    obj[val] = el;
  }
  return obj;
};

// Remove all of el's following siblings
removeSibs = function(el) {
  while (el.nextElementSibling) {
    el.parentNode.removeChild(el.nextElementSibling);
  }
};

// Populate the text nodes of elRoot with values from the text array list. null
// elements are skipped. list is an array of zero or null element, zero or more
// string element, or an array of nulls, strings, and arrays.
elementNewWrite = function(elRoot, list) {
  var j, str, el;
  el = elRoot.firstElementChild;
  for (j = 0; j < list.length; j++) {
    str = list[j];
    if (typeof str === 'string') {
      el.innerText = str;
    } else if (str === null) {
      // no op
    } else {
      // assume array
      elementNewWrite(el, str);
    }
    el = el.nextElementSibling;
  }
};

// elementNew is a convenience function for programmatically constructing
// blocks of possibly complex HTML. Rather than building up nodes from scratch,
// it works by replacing text nodes of a deeply cloned node that already
// exists. The source node is not modified.
//
// elSource is cloned and used a template. Its text nodes are replaced with
// values from the text array textList. null elements are skipped.
//
// For example, programatically contruct a clone of the following HTML with
// different values.
//
// <div>
//   <div>►</div>
//   <div><span>24 May 2023</span><br><span>Bank · Wages</span><br><span>Actual 103.50</span></div>
//   <div>45.00</div>
//   <div>100.00</div>
// </div>
//
// el = elementNew(elTemplate, [
//   null,
//   ['1 June 2023', null, 'Farmer Bob', null, 'Actual 20.25'],
//   Number(j).toFixed(2),
//   Number(j * 3).toFixed(2)
// ]);
//
// The null elements indicate that the text that exists in elSource should be
// preserved or, in the case of elements, skipped. The nested array populates
// the spans of second div block. The nulls are used to preserve the br blocks.
elementNew = function(elSource, textList) {
  var elNew;

  elNew = elSource.cloneNode(true);
  elementNewWrite(elNew, textList);
  return elNew;
};

// This function follows a relative path to an element and returns that
// element. el specifies the root element. list is an array of integers that
// identify the zero-based position of elements to follow. For example,
// consider call elementRelative(el, [0, 2, 1]). This routine follows the first
// child of el, then the third child of that element, then the second child of
// that element. The function returns the final element on the path. null is
// returned if the pathed element cannot be found.
elementRelative = function(el, list) {
  var pos;
  if (el) {
    if (list.length > 0) {
      el = el.firstElementChild;
      pos = list.shift();
      while ((pos) && (el)) {
        el = el.nextElementSibling;
        pos--;
      }
      el = elementRelative(el, list);
    }
  }
  return el;
};

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
  sample, ledgerView, templates;

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

  // templates is an object that associates names with deeply cloned elements
  // from the document. Each name is the value of the data-template attribute,
  // eg, data-template="ledger-row".
  templates = attrMapLoad('data-template', true, true);

  // sample defines the principal data structure used in this application
  sample = {
    "name": "Bank of Whoville / Checking",
    "balance_start": 100,
    "rows": [
      {
        'date': '2022-09-01',
        'transactee': 'Whoville Hardware',
        'checknum': '4021',
        'amount': -48,
        'comment': 'Horseshoes and nails',
        'reconciled': true,
        'void': false
      },
      {
        'date': '2022-09-12',
        'transactee': 'Bank of Whoville',
        'checknum': '',
        'amount': 120.5,
        'comment': 'Sale of alfalfa',
        'reconciled': true,
        'void': false
      },
      {
        'date': '2022-09-30',
        'transactee': 'Whoville Grains',
        'checknum': '4022',
        'amount': -27.5,
        'comment': 'Rye seed',
        'reconciled': false,
        'void': false
      }
    ]
  };

  ledgerView = function(data) {
    var el, elParent, elTemplate, j, bank, actual, rec, list;

    bank = data.rows.balance_start || 0;
    actual = data.rows.balance_start || 0;

    // Sort data by date ascending
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

    // Calculate bank and actual talies
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

    // Display records with tallies by date descending
    elParent = queryElement('id', 'ledger');
    // console.log('elParent (id=ledger)', elParent);
    removeSibs(elParent.firstElementChild);
    // console.log('templates', templates);
    elTemplate = templates['ledger-row'];
    // console.log('elTemplate', elTemplate);
    for (j = data.rows.length; j > 0; j--) {
      rec = list[j - 1];
      el = elementNew(elTemplate, [
        null,
        [rec.checknum, null, rec.transactee, null, Number(rec.actual).toFixed(2)],
        Number(rec.amount).toFixed(2),
        Number(rec.bank).toFixed(2)
      ]);
      if (rec.reconciled) {
        el.classList.remove('ledger-active');
      } else {
        el.classList.add('ledger-active');
      }

      // 'date': '2022-09-12',
      // 'transactee': 'Bank of Whoville',
      // 'checknum': '',
      // 'amount': 120.5,
      // 'comment': 'Sale of alfalfa',
      // 'reconciled': true,
      // 'void': false
      //
      // <div data-template="ledger-row" class="ledger-active">
      //   <div data-show="/page/form|1">►</div>
      //   <div><span>24 May 2023</span><br><span>Bank · Wages</span><br><span>Actual 103.50</span></div>
      //   <div>45.00</div>
      //   <div>100.00</div>
      // </div>

      elParent.appendChild(el);
    }
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
    var fnc, j, popCount, el;

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
