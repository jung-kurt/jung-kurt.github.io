// This file contains application-specific code. In general, this file and
// utility.js would be amalgamated and minified in a deployment phase. All code
// that pertains to the application is confined to the Application object.
//
// Note: some minifiers (for example, minify
// [https://github.com/tdewolff/minify] with its default settings) can
// aggressively optimize away some ECMAScript 3 constructions. This can limit
// this app's use on older devices.

var
  Application,

// The Application object contains all application-specific functions and data.
// Everything outside of is generic for all applications.
Application = function() {
  var
    action,
    data,
    datalistPopulate,
    ledgerView,
    pageFnc,
    pageShow,
    pageShowPrev,
    pageStk,
    recDefault,
    restoreSuccess,
    sample,
    templates,
    util;

  // Load Utility singleton
  util = UtilityFactory.getInstance();

  // Principal data structure. data is populated either from the file system or
  // with a builtin sample data structure.
  data = null;

  // pageStk records the path of pages that have been shown so that the
  // currently displayed page is at the top of the stack. This facilitates the
  // 'return' action so previously displayed pages can be shown. The
  // operational difference with a stack is that when a page is shown that is
  // already on the stack, then the stack is unwound to that element rather
  // than augmented.
  pageStk = [];

  // pageFnc is an object that maps a page name to a function that is called
  // before that page is displayed. It provides an opportunity to modify the
  // page's content before it is shown.
  pageFnc = {};

  // templates is an object that associates names with deeply cloned elements
  // from the document. Each name is the value of the data-template attribute,
  // eg, data-template="ledger-row". This facilitates the ceation of new
  // elements based on easily-defined HTML constructions.
  templates = util.attrMapLoad('data-template', true, true);

  // Return default record
  recDefault = function(pos) {
    return {
      'pos': pos || -1,
      'date': util.dateToStdStr(util.daysAdd(0)),
      'transactee': '',
      'checknum': '',
      'amount': 0,
      'comment': '',
      'reconciled': false,
      'void': false
    };
  };

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

  // Populate the transactee datalist so that names that are already part of
  // the dataset will be available as a droplist in the transction form.
  datalistPopulate = function(data) {
    var elList, elOpt, el, j, row, list;
    elList = util.queryElement('id', 'transactees');
    if (elList) {
      elOpt = templates.option;
      if (elOpt) {
        list = [];
        for (j = 0; j < data.rows.length; j++) {
          row = data.rows[j];
          list.push(row.transactee);
        }
        util.sortUnique(list);
        util.removeAllChildren(elList);
        for (j = 0; j < list.length; j++) {
          el = util.elementNew(elOpt, []);
          el.setAttribute('value', list[j]);
          elList.appendChild(el);
        }
      }
    }
  };

  // Present the ledger records. This is the most complicated function in this
  // example. The specified data is first sorted by ascending date, the tallies
  // are made based on starting balance and each record's reconciled and void
  // flags, then an alternate list is made of these records with the tallies
  // and original positions included. The records are converted to HTML using
  // the util.elementNew() function based on a template in the original
  // HTML page.
  ledgerView = function(data) {
    var el, elParent, elTemplate, j, bank, actual, rec, list, aStr, bStr;

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
      list.push(rec);
    }

    // Display records with tallies by date descending
    elParent = util.queryElement('id', 'ledger');
    util.removeSibs(elParent.firstElementChild);
    elTemplate = templates['ledger-row'];
    for (j = data.rows.length; j > 0; j--) {
      rec = list[j - 1];
      aStr = util.dotSep(util.dateShort(rec.date), rec.checknum, rec.reconciled ? '✓' : '',
        rec['void'] ? 'Void' : '');
      bStr = util.dotSep(rec.transactee, rec.comment);

      el = util.elementNew(elTemplate, [
        null,
        [aStr, null, bStr, null, 'Actual ' + Number(rec.actual).toFixed(2)],
        Number(rec.amount).toFixed(2),
        Number(rec.bank).toFixed(2)
      ]);
      el.firstElementChild.setAttribute('data-show', '/page/form|' + rec.pos);
      if (rec['void']) {
        el.classList.remove('ledger-active');
        el.firstElementChild.nextElementSibling.classList.add('ledger-void');
      } else {
        if (rec.reconciled) {
          el.classList.remove('ledger-active');
        } else {
          el.classList.add('ledger-active');
        }
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
    el = util.queryElement('id', 'ledger');
    if (el) {
      if (data) {
        ledgerView(data);
      } else {
        console.log('data not set in /page/ledger');
      }
    }
  };

  pageFnc['/page/form'] = function(list) {
    var pos, rec;
    if (data) {
      pos = Number(list[0]);
      if (pos >= 0) {
        rec = data.rows[pos];
      } else {
        rec = recDefault(-1);
      }
      rec.pos = list[0];
      util.formSet('transaction', rec);
      datalistPopulate(data);
    } else {
      console.log('data not set in /page/form');
    }
  };

  // Display the page that was visible before the curreently-displayed page.
  // The previous page's pre-display function will be called it is present.
  pageShowPrev = function() {
    var pg;

    if (pageStk.length > 1) {
      pageStk.pop();
      pg = pageStk.pop();
      pageShow(pg.name, pg.list);
    }
  };

  // This function is called if reading a JSON project from the local
  // filesystem succeeds.
  restoreSuccess = function(contents, info) {
    if (info.type === "application/json") {
      data = util.jsonDecode(contents);
      if (data) {
        // TODO check for data validity here
        pageShow('/page/ledger', []);
      } else {
        console.log('failure to decode JSON file');
      }
    } else {
      console.log('expecting JSON file, got ' + info.type);
      data = null;
    }
  };

  // Handle a click on an element that has the data-action attribute set.
  action = function(name, list) {
    var str, el, pos, rec;
    switch (name) {
      case 'new':
        // Use -1 as position; the form function will interpret this as new,
        // default record
        pageShow('/page/form', ['-1']);
        break;
      case 'return':
        pageShowPrev();
        break;
      case 'ledger':
        if (data) {
          pageShow('/page/ledger', []);
        } else {
          pageShow('/page/ledger-no-data', []);
        }
        break;
      case 'sample':
        data = sample;
        pageShow('/page/ledger', []);
        break;
      case 'project-save':
        console.log('project save');
        str = util.jsonEncode(data, '  ');
        if (str) {
          util.fileWrite(str, 'application/json', 'sample.json');
        }
        break;
      case 'project-restore':
        data = null;
        el = util.queryElement('id', 'datafile');
        if (el) {
          util.fileRead(el, restoreSuccess);
        }
        break;
      case '/form/save':
        rec = util.formGet('transaction');
        pos = Number(rec.pos);
        if (data) {
          if (pos >= 0) {
            data.rows[pos] = rec;
          } else {
            data.rows.push(rec);
          }
          pageShowPrev();
        } else {
          console.log('data not set in /form/save');
        }
        break;
    }
  };

  // Display the specified page and hide all of its siblings. If a pre-display
  // function is defined for the page, show it before making the page visible.
  pageShow = function(name, list) {
    var fnc, j, popCount, el;

    el = util.queryElement('data-page', name);
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
      util.bankShow(el);
    }
  };

  // Listen to clicks on elements that have the 'data-show' and 'data-action'
  // attributes.
  util.listenClick({
    'data-show': pageShow,
    'data-action': action
  });

  // Display the home page to start.
  pageShow('/', []);

};

// Run the program
new Application();
