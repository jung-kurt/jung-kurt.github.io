// This file contains a utility object with methods that can facilitate the
// programming of an application. To instantiate it, call
//
//   util = Utility.getInstance();
//
// This returns a singleton object, that is, an object that is created at first
// call and reused for subsequent instantiations. No state is stored in this
// object.

var Utility;

Utility = (function() {

  function UtilityClass() {

    var thisUtil, empty;

    thisUtil = this;

    empty = function() {};

    // Parse the specified JSON record. If an error occurs, null is returned.
    this.jsonDecode = function(str) {
      try {
        return JSON.parse(str);
      } catch (error) {
        return null;
      }
    };

    // Encode the specified object to a string. space is an optional string or
    // number and is used to insert whitespace. An empty string is returned if
    // an error occurs.
    this.jsonEncode = function(obj, space) {
      try {
        return JSON.stringify(obj, null, space);
      } catch (error) {
        return '';
      }
    };

    // Raises a system dialog to write str to the local filesystem. mime
    // specifies the MIME type of str. filename specifies the suggested name of
    // the file.
    this.fileWrite = function(str, mime, filename) {
      var aEl, url;

      url = URL.createObjectURL(new Blob([str], { type: mime || 'text/plain'}));
      aEl = document.createElement('a');
      aEl.setAttribute('href', url);
      aEl.setAttribute('download', filename || '');
      aEl.click();
      window.setTimeout(function() {
        URL.revokeObjectURL(url);
        // console.log('revoke ' + filename + ' data url');
      }, 60000);

    };

    // fileRead is called with the DOM element of a file input element when
    // that element receives the input event. If the file is successfully read,
    // success is called with the file contents and the file object. This
    // object has the following fields: name (eg, "data.json"), size (eg, 143),
    // type (eg, "application/json"). If an error occurs, err is called with an
    // error message.
    this.fileRead = function(el, success, err) {
      var rdr, fl;

      if (typeof err !== 'function') err = empty;
      if (el.files.length) {
        fl = el.files[0];
        rdr = new FileReader();
        rdr.onload = function(content) {
          if (content && content.target && content.target.result) {
            if (typeof success === 'function') success(content.target.result, fl);
          } else err('contents not loaded');
        };
        rdr.readAsText(fl);
      } else err('no files selected');
    };

    // Return object that associates names with elements that contain the
    // specified attribute. If deep is true, then for each retrieved template,
    // replace the element value with a deeply-cloned copy. If removeAttr is
    // true, remove the specified attribute from the clone.
    this.attrMapLoad = function(attr, deep, removeAttr) {
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
    this.removeSibs = function(el) {
      while (el.nextElementSibling) {
        el.parentNode.removeChild(el.nextElementSibling);
      }
    };

    // Populate the text nodes of elRoot with values from the text array list.
    // null elements are skipped. list is an array of zero or null element,
    // zero or more string element, or an array of nulls, strings, and arrays.
    this.elementNewWrite = function(elRoot, list) {
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
          thisUtil.elementNewWrite(el, str);
        }
        el = el.nextElementSibling;
      }
    };

    // elementNew is a convenience function for programmatically constructing
    // blocks of possibly complex HTML. Rather than building up nodes from
    // scratch, it works by replacing text nodes of a deeply cloned node that
    // already exists. The source node is not modified.
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
    // The null elements indicate that the text that exists in elSource should
    // be preserved or, in the case of elements, skipped. The nested array
    // populates the spans of second div block. The nulls are used to preserve
    // the br blocks.
    this.elementNew = function(elSource, textList) {
      var elNew;

      elNew = elSource.cloneNode(true);
      thisUtil.elementNewWrite(elNew, textList);
      return elNew;
    };

    // This function follows a relative path to an element and returns that
    // element. el specifies the root element. list is an array of integers
    // that identify the zero-based position of elements to follow. For
    // example, consider call elementRelative(el, [0, 2, 1]). This routine
    // follows the first child of el, then the third child of that element,
    // then the second child of that element. The function returns the final
    // element on the path. null is returned if the pathed element cannot be
    // found.
    this.elementRelative = function(el, list) {
      var pos;
      if (el) {
        if (list.length > 0) {
          el = el.firstElementChild;
          pos = list.shift();
          while ((pos) && (el)) {
            el = el.nextElementSibling;
            pos--;
          }
          el = thisUtil.elementRelative(el, list);
        }
      }
      return el;
    };

    // For dotSep(null, "one", "two", "", "", false, "three", undefined),
    // return "one · two · three".
    this.dotSep = function() {
      var ret, j, sep, str;
      sep = '';
      ret = '';
      for (j = 0; j < arguments.length; j++) {
        str = arguments[j];
        if ((str) && (str !== "")) {
          ret = ret + sep + str;
          sep = ' · ';
        }
      }
      return ret;
    };

    // This function listens to clicks at the document level. handlers is an
    // object that maps attributes, eg, 'data-show', to a function that is
    // called when the click initiator contains that that attribute. The
    // function is called with the tokenized value of the attribute split with
    // the '|' character.
    //
    // For example, consider handlers to be the object
    //
    //   { "data-show": fncShow, "data-action: fncAction }
    //
    // and the HTML to contain the element
    //
    //   <button data-show="/page/one|active|sum">Page 1</button>
    //
    // If this button is clicked, then fncShow('/page/one', ['active', 'sum'])
    // is called.
    this.listenClick = function(handlers) {
      // The click handler is set at the document level, rather than on the
      // initiator, to avoid garbage collection issues with event handlers.
      document.addEventListener('click', function(evt) {
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

    // queryElement returns the first element encountered that has the
    // specified attribute and value assigned. null is returned a matching
    // element cannot be found. For example, if <span id="/page/42"> is defined
    // in the DOM, then the call queryElement('id', '/page/42') will return
    // that span element.
    this.queryElement = function(attr, val) {
      return document.querySelector('[' + attr + '="' + val + '"]');
    };

    // Set target element as visible and each of its siblings as hidden. The
    // specified element el is the target if rel is zero or missing. It is the
    // previous or next sibling if rel is -1 or 1, respectively. The value for
    // rel can be any integer. If the position of the element el plus rel
    // exceeds the bounds of the sibling list it wraps. For example, the
    // visibility of an element in a bank of two elements is toggled when rel
    // is any odd number.
    this.bankShow = function(el, rel) {
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

    // This function returns a list of all input fields in the specified form
    // that have the id attribute set. The return value is null if the form
    // cannot be found.
    this.formInputs = function(formName) {
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
    this.formSet = function(formName, inputMap) {
      var j, inpEl, inpList, key, val;

      // console.log('formSet', inputMap);
      inpList = thisUtil.formInputs(formName);
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
              // console.log('number input field', key, val);
              // Convert from number to string
              inpEl.value = Number(val).toFixed(2);
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
    this.formGet = function(formName) {
      var j, inpEl, inpList, key, val, form;

      form = {};
      inpList = thisUtil.formInputs(formName);
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

    // Return the element corresponding to el. If el is a string, it is assumed
    // to be a selector. In this case, the first matching element is returned.
    // Otherwise, el itself is returned.
    this.elGet = function(el) {
      if (typeof el === 'string') {
        el = document.querySelector(el);
      }
      return el;
    };

    this.removeAllChildren = function(el) {
      if (el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      }
    };

    // Replace all children of the element specified by parent with the element
    // specified by childEl. parent may be a selector string in which case the
    // first matching element is treated as the parent element.
    this.setChild = function(parent, childEl) {
      parent = thisUtil.elGet(parent);
      if (parent) {
        thisUtil.removeAllChildren(parent);
        parent.appendChild(childEl);
      }
    };

    // Set the inner text of the specified element. parent may be a selector
    // string in which case the first matching element is teated as the parent
    // element.
    this.setText = function(el, str) {
      el = thisUtil.elGet(el);
      if (el) {
        el.innerText = str;
      }
    };

    // Return a date object corresponding to current date plus dy days. dy should
    // be negative for past dates.
    this.daysAdd = function(dy) {
      var dt;
      dt = new Date();
      dt.setTime(dt.getTime() + dy * 86400000); // Number of milliseconds per day
      return dt;
    };

    // Return a standard date string (eg, '2006-01-02') corresponding to current
    // date plus dy. dy should be negative for past dates.
    this.strDaysAdd = function(dy) {
      return thisUtil.dateToStdStr(thisUtil.daysAdd(dy));
    };

    this.strMonthShList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.reNonDigit = /\D/g;

    // Return '2006-01-02' from a JavaScript date.
    this.dateToStdStr = function(dt) {
      return '' + dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
    };

    // Return '2 Jan 2006' from a JavaScript date.
    this.dateToStr = function(dt) {
      return '' + dt.getDate() + ' ' + thisUtil.strMonthShList[dt.getMonth()] + ' ' + dt.getFullYear();
    };

    // Return Date from string in standard string form ('2006-01-02' or
    // '2006/01/02' or '20060102'). Returns null if dateStr is not valid.
    this.dateFromStr = function(dateStr) {
      var str, d, m, y, dt;
      dt = null;
      str = dateStr.replace(thisUtil.reNonDigit, '');
      if (str.length === 8) {
        y = parseInt(str.substring(0, 4), 10);
        if (!isNaN(y)) {
          m = parseInt(str.substring(4, 6), 10);
          if (!isNaN(m)) {
            d = parseInt(str.substring(6, 8), 10);
            if (!isNaN(d)) {
              dt = new Date(y, m - 1, d);
            }
          }
        }
      }
      return dt;
    };

    // Return '2 Jan 2006' from '2006-01-02'
    this.dateShort = function(stdDt) {
      var dt;
      dt = thisUtil.dateFromStr(stdDt);
      if (dt) {
        stdDt = thisUtil.dateToStr(dt);
      }
      return stdDt;
    };

    // Given an array of a simple type, eg string, sort the array and remove
    // duplicates.
    this.sortUnique = function(a) {
      a.sort();
      a.filter(function(item, pos, b) {
        return !pos || item !== b[pos - 1];
      });
    };

  }

  var instance;

  return {
    getInstance: function() {
      if (!instance) {
        instance = new UtilityClass();
        delete instance.constructor;
      }
      return instance;
    }
  };

})();
