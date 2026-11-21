/* =====================================================================
   PawSync prototype script  (put this file in /JS/pawsync.js)
   ---------------------------------------------------------------------
   Basic JS only: no backend, no database. Everything is saved in the
   browser's localStorage, so data stays after a refresh or page change.

   Add this ONE line before </head> on every page in /html:
     <script src="../JS/pawsync.js" defer></script>

   Login / Create account stay in login.html (the team's own script).
   This file reads the same session (sessionStorage 'pawsyncSession')
   and owner accounts (localStorage 'pawsyncOwnerAccounts').

   Demo logins (choose the matching "Log in as" option):
     Pet owner    : trishia@example.com / pawsync123
     Clinic staff : clinicstaff@gmail.com / 12345678
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- Settings you can change ---------- */
  var KEY = 'pawsync:v2:'; // change the number to wipe old demo data
  var NOW = new Date();
  var YEAR = NOW.getFullYear(); // the calendar always follows the device's current year
  var TODAY = YEAR + '-' + pad(NOW.getMonth() + 1) + '-' + pad(NOW.getDate());
  var LAST_DAY = YEAR + '-12-31'; // last bookable day (end of the current year)
  var LIMIT = 15; // patients per day (from the proposal)
  var REQUIRE_LOGIN = true; // false = portal/staff pages open without logging in
  var MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  var NEWEST_FIRST = { 'invoice-list': 1, 'report-list': 1 };
  var TIMES = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM'
  ];
  var FULL_BASE = {}; // a few days start out full so the "Full" state can be demoed
  FULL_BASE[rel(2)] = 15;
  FULL_BASE[rel(3)] = 15;
  FULL_BASE[rel(9)] = 15;
  function rel(n) {
    return addDays(TODAY, n); // a date n days from today
  }
  function monthLabel(offset) {
    var d = new Date(YEAR, NOW.getMonth() + offset, 1);
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------- Sample data (dates are relative to today) ---------- */
  var SEED = {
    'appointment-list': [
      ['A-5082', TODAY + ' 09:00', 'Milo', 'Alex Santos', 'Wellness exam', 'Confirmed'],
      ['A-5083', TODAY + ' 10:30', 'Luna', 'Jamie Reyes', 'Vaccination', 'Waiting'],
      ['A-5084', TODAY + ' 13:00', 'Buddy', 'Sam Cruz', 'Dental check', 'Confirmed']
    ],
    'invoice-list': [
      ['INV-8041', 'Alex Santos / Milo', TODAY, '1,250.00', 'Paid'],
      ['INV-8040', 'Jamie Reyes / Luna', TODAY, '850.00', 'Unpaid'],
      ['INV-8039', 'Sam Cruz / Buddy', rel(-1), '2,100.00', 'Partially paid'],
      ['INV-8038', 'Alex Santos / Milo', rel(-8), '1,600.00', 'Paid'],
      ['INV-8037', 'Jamie Reyes / Pepper', rel(-35), '3,400.00', 'Paid']
    ],
    'client-list': [
      ['C-2031', 'Alex Santos', '0917 555 0131', 'alex.santos@example.com', 'Milo'],
      [
        'C-2026',
        'Jamie Reyes',
        '0918 555 0142',
        'jamie.reyes@example.com',
        'Luna, Pepper'
      ],
      ['C-2014', 'Sam Cruz', '0920 555 0164', 'sam.cruz@example.com', 'Buddy']
    ],
    'confined-pet-list': [
      ['W-014', 'Max', 'Taylor Lim', rel(-1), 'Under observation'],
      ['W-011', 'Oreo', 'Casey Tan', TODAY, 'Stable'],
      ['W-009', 'Ginger', 'Robin Lee', TODAY, 'Needs attention']
    ],
    'inventory-list': [
      ['I-302', 'Examination gloves', 'Medical supplies', '24', '20'],
      ['I-211', 'Canine vaccine', 'Vaccines', '8', '10'],
      ['I-148', 'Pet bandage roll', 'First aid', '6', '12']
    ],
    'patient-record-list': [
      ['P-1042', 'Milo', 'Alex Santos', 'Dog', rel(-1)],
      ['P-1038', 'Luna', 'Jamie Reyes', 'Cat', rel(-2)],
      ['P-1019', 'Buddy', 'Sam Cruz', 'Dog', rel(-5)]
    ],
    'report-list': [
      ['Appointment summary', monthLabel(0), 'Dr. Maralit', rel(-1), 'Ready'],
      ['Inventory reorder list', monthLabel(0), 'K. Nieves', rel(-2), 'Ready'],
      ['Monthly billing overview', monthLabel(-1), 'T. Maralit', rel(-12), 'Archived']
    ],
    'staff-user-list': [
      [
        'U-001',
        'Dr. Trishia Maralit',
        'Veterinarian',
        'trishia.maralit@example.com',
        'Active'
      ],
      ['U-002', 'Kaye Nieves', 'Receptionist', 'kaye.nieves@example.com', 'Active'],
      ['U-003', 'Lysa Pido', 'Veterinary nurse', 'lysa.pido@example.com', 'Active']
    ]
  };
  var CLIENT_EMAIL = 'trishia@example.com';
  var EXTRA = {
    // rows that belong to the demo pet-owner account
    'patient-record-list': [
      {
        c: ['P-0042', 'Dagul', 'Trishia Maralit', 'Dog', rel(-3)],
        m: {
          owner: CLIENT_EMAIL,
          breed: 'Aspin',
          gender: 'Male',
          birthday: '2020-03-14',
          color: 'Brown/Black',
          people: [{ name: 'Trishia Maralit', rel: 'Owner', contact: '09123456789' }]
        }
      },
      {
        c: ['P-0043', 'Luna', 'Trishia Maralit', 'Cat', rel(-23)],
        m: {
          owner: CLIENT_EMAIL,
          breed: 'Domestic shorthair',
          gender: 'Female',
          birthday: '2022-06-01',
          color: 'White',
          people: [{ name: 'Trishia Maralit', rel: 'Owner', contact: '09123456789' }]
        }
      }
    ],
    'client-list': [
      {
        c: ['C-2040', 'Trishia Maralit', '09123456789', CLIENT_EMAIL, 'Dagul, Luna'],
        m: {}
      }
    ],
    'appointment-list': [
      {
        c: [
          'A-5090',
          rel(7) + ' 10:00',
          'Dagul',
          'Trishia Maralit',
          'Vaccination',
          'Reserved'
        ],
        m: { owner: CLIENT_EMAIL }
      }
    ]
  };
  var SEED_ACCOUNTS = [
    {
      name: 'Trishia Maralit',
      email: CLIENT_EMAIL,
      mobile: '09123456789',
      password: 'pawsync123',
      address: '123 Sample Street, Manila'
    }
  ];

  /* ---------- Tiny helpers ---------- */
  var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(k, d) {
    try {
      var v = localStorage.getItem(KEY + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  }
  function save(k, v) {
    try {
      localStorage.setItem(KEY + k, JSON.stringify(v));
    } catch (e) {}
  }
  function pad(n) {
    return String(n).padStart(2, '0');
  }
  function longDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  function shortDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric'
    });
  }
  function addDays(iso, n) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function to24(t) {
    var m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(t);
    if (!m) return t;
    var h = (+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0);
    return pad(h) + ':' + m[2];
  }
  function to12(t) {
    var m = /^(\d+):(\d+)/.exec(t);
    if (!m) return t;
    var h = +m[1];
    return (h % 12 || 12) + ':' + m[2] + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function badge(v) {
    var s = String(v),
      c = 'reserved';
    if (/emerg/i.test(s)) c = 'emergency';
    else if (/cancel|inactive|unpaid|void|archiv/i.test(s)) c = 'cancelled';
    else if (/wait|priority|observ|attention|progress|partial/i.test(s)) c = 'priority';
    else if (/complet|paid|done|discharge|ready|stable/i.test(s)) c = 'done';
    return '<span class="badge badge--' + c + '">' + esc(s) + '</span>';
  }

  /* ---------- Page styles, toast, dialog ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#ps-toasts{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:340px}' +
    '.ps-toast{background:#1B2A41;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 8px 20px rgba(27,42,65,.25)}.ps-toast--err{background:#B3261E}' +
    '.ps-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}.ps-section{margin-top:24px}' +
    '.ps-actions{white-space:nowrap}.ps-search{max-width:320px;margin:0 0 16px}.ps-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    '.ps-reset{margin-top:32px}.ps-hint{margin-top:16px}';
  document.head.appendChild(css);

  function toast(msg, type) {
    var box = $('#ps-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ps-toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    t.className = 'ps-toast' + (type === 'err' ? ' ps-toast--err' : '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 3500);
  }
  function dialog(title, body, okLabel, onOk) {
    var d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML =
      '<form><h2 class="modal__title">' +
      esc(title) +
      '</h2><div>' +
      body +
      '</div><div class="modal__actions">' +
      '<button type="button" class="btn btn--outline" data-x>Cancel</button><button type="submit" class="btn btn--primary">' +
      esc(okLabel) +
      '</button></div></form>';
    document.body.appendChild(d);
    $('[data-x]', d).onclick = function () {
      d.close();
    };
    d.addEventListener('close', function () {
      d.remove();
    });
    $('form', d).addEventListener('submit', function (e) {
      e.preventDefault();
      if (onOk(d) !== false) d.close();
    });
    d.showModal();
  }
  function setErr(input, msg) {
    var e = document.getElementById(input.id + '-error');
    if (!e) return;
    e.textContent = msg;
    e.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    if (input.type !== 'checkbox' && input.type !== 'radio')
      input.classList.add('form-input--error');
  }
  function clearErr(input) {
    var e = document.getElementById(input.id + '-error');
    if (e) {
      e.textContent = '';
      e.hidden = true;
    }
    input.removeAttribute('aria-invalid');
    input.classList.remove('form-input--error');
  }

  /* ---------- Data: accounts, session, table rows ---------- */
  function accounts() {
    var a = [];
    try {
      a = JSON.parse(localStorage.getItem('pawsyncOwnerAccounts') || '[]');
    } catch (e) {
      a = [];
    }
    var added = false;
    SEED_ACCOUNTS.forEach(function (seed) {
      if (
        !a.some(function (x) {
          return x.email === seed.email;
        })
      ) {
        a.push(seed);
        added = true;
      }
    });
    if (added) saveAccounts(a);
    return a;
  }
  function saveAccounts(a) {
    try {
      localStorage.setItem('pawsyncOwnerAccounts', JSON.stringify(a));
    } catch (e) {}
  }
  function findAccount(idv) {
    idv = idv.toLowerCase().replace(/\s/g, '');
    return accounts().filter(function (a) {
      return a.email.toLowerCase() === idv || a.mobile === idv;
    })[0];
  }
  function session() {
    var s = null;
    try {
      s = JSON.parse(sessionStorage.getItem('pawsyncSession') || 'null');
    } catch (e) {
      s = null;
    }
    if (!s) return null;
    if (s.role === 'owner') {
      var acc = accounts().filter(function (a) {
        return a.name === s.name;
      })[0];
      s.email = acc ? acc.email : s.name; // owner key that links pets and appointments
    }
    return s;
  }
  function firstName(n) {
    return String(n)
      .replace(/^Dr\.\s*/, '')
      .split(' ')[0];
  }
  function rows(id) {
    var r = load('t:' + id);
    if (!r) {
      r = (SEED[id] || [])
        .map(function (c) {
          return { c: c.slice(), m: {} };
        })
        .concat(JSON.parse(JSON.stringify(EXTRA[id] || [])));
      save('t:' + id, r);
    }
    return r;
  }
  function saveRows(id, r) {
    save('t:' + id, r);
  }
  function nextId(id) {
    var best = null;
    rows(id).forEach(function (x) {
      var m = /^(.*?)(\d+)$/.exec(x.c[0]);
      if (m && (!best || +m[2] > best.n)) best = { p: m[1], n: +m[2], w: m[2].length };
    });
    return best ? best.p + String(best.n + 1).padStart(best.w, '0') : '';
  }
  function dayCount(d) {
    var n = FULL_BASE[d] || 0;
    rows('appointment-list').forEach(function (r) {
      if (r.c[1].slice(0, 10) === d && !/cancel/i.test(r.c[5])) n++;
    });
    return n;
  }
  function nextOpen(d) {
    for (var i = 0; i < 400; i++) {
      d = addDays(d, 1);
      if (d > LAST_DAY) return null;
      if (dayCount(d) < LIMIT) return d;
    }
    return null;
  }
  function myPets() {
    var s = session();
    return rows('patient-record-list').filter(function (r) {
      return r.m.owner === s.email;
    });
  }
  function myAppts() {
    var s = session();
    return rows('appointment-list').filter(function (r) {
      return r.m.owner === s.email;
    });
  }

  /* ---------- Login, logout, guard ---------- */
  function logout() {
    sessionStorage.removeItem('pawsyncSession');
    location.href = 'login.html';
  }
  function resetDemo() {
    if (
      !confirm(
        'Reset all demo data in this browser? Accounts, pets, appointments and table entries go back to the sample data.'
      )
    )
      return;
    Object.keys(localStorage).forEach(function (k) {
      if (k.indexOf(KEY) === 0) localStorage.removeItem(k);
    });
    location.href = 'login.html';
  }
  function guard() {
    var s = session(),
      staff = /^staff/.test(page) && page !== 'style-guide.html',
      portal = /^portal/.test(page);
    if (!REQUIRE_LOGIN || (!staff && !portal)) return true;
    if (!s) {
      location.replace('login.html?next=' + encodeURIComponent(page));
      return false;
    }
    if (staff && s.role !== 'staff') {
      location.replace('portal-dashboard.html');
      return false;
    }
    if (portal && s.role !== 'owner') {
      location.replace('staff.html');
      return false;
    }
    return true;
  }
  function addResetLink() {
    var main = $('main');
    if (!main) return;
    var p = document.createElement('p');
    p.className = 'ps-reset';
    p.innerHTML =
      '<button type="button" class="btn btn--link btn--small">Reset demo data</button>';
    $('button', p).onclick = resetDemo;
    main.appendChild(p);
  }

  /* ---------- Public pages ---------- */
  function publicPages() {
    var s = session(),
      login = $('.site-header a[href="login.html"]');
    if (s && login) {
      login.textContent = 'My account';
      login.setAttribute(
        'href',
        s.role === 'staff' ? 'staff.html' : 'portal-dashboard.html'
      );
    }
    $$('a.btn').forEach(function (a) {
      if (/^book (a visit|an appointment)/i.test(a.textContent.trim()))
        a.setAttribute('href', 'portal-book-appointment.html');
    });
    var msg = $('#message'),
      form = msg && msg.closest('form');
    if (form)
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var list = load('messages', []);
        list.push({
          name: $('#name').value,
          email: $('#email').value,
          message: msg.value,
          at: new Date().toISOString()
        });
        save('messages', list);
        form.reset();
        toast('Message sent. It is saved in this browser (prototype).');
      });
  }

  function loginPage() {
    var lf = $('#login-form');
    if (!lf || !$('#register-form')) return;
    lf.insertAdjacentHTML(
      'afterend',
      '<div class="alert alert--info ps-hint"><p class="alert__title">Demo accounts</p>' +
        '<p>Pet owner: <strong>trishia@example.com</strong> / pawsync123<br>' +
        'Clinic staff: <strong>clinicstaff@gmail.com</strong> / 12345678</p></div>'
    );
    accounts(); // makes sure the demo owner account exists
    var forgot = $('#panel-login a[href="#"]');
    if (forgot)
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        var acc = findAccount(
          prompt('Enter the email or mobile number of your account:') || ''
        );
        if (!acc) {
          toast('No owner account found.', 'err');
          return;
        }
        var pw = prompt('Enter a new password (at least 8 characters):') || '';
        if (pw.length < 8) {
          toast('Password was not changed. Use at least 8 characters.', 'err');
          return;
        }
        acc.password = pw;
        saveAccounts(
          accounts().map(function (a) {
            return a.email === acc.email ? acc : a;
          })
        );
        toast('Password updated. You can log in now.');
      });
  }

  /* ---------- Client portal ---------- */
  function portalCommon() {
    var s = session(),
      hi = $('.portal-header__greeting');
    if (hi) {
      hi.textContent = 'Hi, ' + firstName(s.name) + '!';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--outline btn--small';
      b.textContent = 'Log out';
      b.onclick = logout;
      hi.insertAdjacentElement('afterend', b);
    }
    $$('main > p').forEach(function (p) {
      if (/will appear/i.test(p.textContent)) p.hidden = true;
    });
    addResetLink();
  }
  function mount(html) {
    var d = document.createElement('div');
    d.className = 'ps-section';
    d.innerHTML = html;
    $('main .ps-reset')
      ? $('main').insertBefore(d, $('main .ps-reset'))
      : $('main').appendChild(d);
    return d;
  }

  function apptRow(r) {
    return {
      id: r.c[0],
      date: r.c[1].slice(0, 10),
      time: r.c[1].slice(11),
      pet: r.c[2],
      service: r.c[4],
      status: r.c[5]
    };
  }

  function dashboardPage() {
    if (page !== 'portal-dashboard.html') return;
    var up = myAppts()
      .map(apptRow)
      .filter(function (a) {
        return a.date >= TODAY && !/cancel|complet/i.test(a.status);
      })
      .sort(function (a, b) {
        return a.date + a.time < b.date + b.time ? -1 : 1;
      });
    var reminders = up.filter(function (a) {
      return a.date <= addDays(TODAY, 7) && /reserved/i.test(a.status);
    });
    var html = '';
    reminders.forEach(function (a) {
      html +=
        '<div class="alert alert--warning" role="status"><p class="alert__title">Reminder</p><p>' +
        esc(a.pet) +
        ' has a ' +
        esc(a.service) +
        ' appointment on ' +
        longDate(a.date) +
        ' at ' +
        to12(a.time) +
        '. <a href="portal-my-appointments.html">Confirm or reschedule</a></p></div>';
    });
    html +=
      '<h2>Upcoming appointments</h2>' +
      (up.length
        ? '<ul>' +
          up
            .slice(0, 5)
            .map(function (a) {
              return (
                '<li>' +
                longDate(a.date) +
                ', ' +
                to12(a.time) +
                ': ' +
                esc(a.pet) +
                ' (' +
                esc(a.service) +
                ') ' +
                badge(a.status) +
                '</li>'
              );
            })
            .join('') +
          '</ul>'
        : '<p>No upcoming appointments.</p>');
    var pets = myPets();
    html +=
      '<h2>Your pets</h2>' +
      (pets.length
        ? '<p>' +
          pets
            .map(function (r) {
              return esc(r.c[1]);
            })
            .join(', ') +
          ' &mdash; <a href="portal-my-pets.html">view all</a></p>'
        : '<p>You have not registered a pet yet.</p>');
    mount(html);
  }

  function myPetsPage() {
    if (page !== 'portal-my-pets.html') return;
    var pets = myPets();
    mount(
      pets.length
        ? '<div class="ps-grid">' +
            pets
              .map(function (r) {
                var m = r.m,
                  people = (m.people || [])
                    .map(function (p) {
                      return esc(p.name) + ' (' + esc(p.rel) + ')';
                    })
                    .join(', ');
                return (
                  '<article class="card"><h2 class="card__title">' +
                  esc(r.c[1]) +
                  '</h2><p>' +
                  esc(r.c[3]) +
                  (m.breed ? ' &middot; ' + esc(m.breed) : '') +
                  (m.gender ? ' &middot; ' + esc(m.gender) : '') +
                  '</p>' +
                  '<p>Birthday: ' +
                  esc(m.birthday || 'not set') +
                  '<br>Color: ' +
                  esc(m.color || 'not set') +
                  '<br>Pet ID: ' +
                  esc(r.c[0]) +
                  '<br>Last visit: ' +
                  esc(r.c[4]) +
                  '</p>' +
                  '<p>Linked owners / caretakers: ' +
                  (people || 'none') +
                  '</p><a class="btn btn--secondary btn--small" href="portal-book-appointment.html?pet=' +
                  encodeURIComponent(r.c[1]) +
                  '">Book a visit</a></article>'
                );
              })
              .join('') +
            '</div>'
        : '<div class="alert alert--info"><p class="alert__title">No pets yet</p><p>Register your first pet to see it here.</p></div>'
    );
  }

  function myAppointmentsPage() {
    if (page !== 'portal-my-appointments.html') return;
    var box = mount('');
    function draw() {
      var list = myAppts()
        .map(apptRow)
        .sort(function (a, b) {
          return a.date + a.time < b.date + b.time ? 1 : -1;
        });
      box.innerHTML = list.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Pet</th><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>' +
          list
            .map(function (a) {
              var open = /reserved|confirmed|waiting/i.test(a.status),
                btn = '';
              if (/reserved/i.test(a.status))
                btn +=
                  '<button type="button" class="btn btn--secondary btn--small" data-act="confirm" data-id="' +
                  esc(a.id) +
                  '">Confirm</button> ';
              if (open)
                btn +=
                  '<button type="button" class="btn btn--outline btn--small" data-act="resched" data-id="' +
                  esc(a.id) +
                  '">Reschedule</button> <button type="button" class="btn btn--link btn--small" data-act="cancel" data-id="' +
                  esc(a.id) +
                  '">Cancel</button>';
              return (
                '<tr><td>' +
                shortDate(a.date) +
                '</td><td>' +
                to12(a.time) +
                '</td><td>' +
                esc(a.pet) +
                '</td><td>' +
                esc(a.service) +
                '</td><td>' +
                badge(a.status) +
                '</td><td class="ps-actions">' +
                (btn || '-') +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table></div>'
        : '<p>You have no appointments yet.</p>';
    }
    function update(id, fn) {
      var all = rows('appointment-list');
      all.forEach(function (r) {
        if (r.c[0] === id) fn(r);
      });
      saveRows('appointment-list', all);
      draw();
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.dataset.id,
        act = b.dataset.act;
      if (act === 'confirm') {
        update(id, function (r) {
          r.c[5] = 'Confirmed';
        });
        toast('Appointment confirmed.');
      }
      if (act === 'cancel' && confirm('Cancel this appointment?')) {
        update(id, function (r) {
          r.c[5] = 'Cancelled';
        });
        toast('Appointment cancelled.');
      }
      if (act === 'resched') {
        var cur = rows('appointment-list').filter(function (r) {
            return r.c[0] === id;
          })[0],
          a = apptRow(cur),
          t12 = to12(a.time);
        var opts = (TIMES.indexOf(t12) < 0 ? [t12] : [])
          .concat(TIMES)
          .map(function (t) {
            return '<option' + (t === t12 ? ' selected' : '') + '>' + t + '</option>';
          })
          .join('');
        dialog(
          'Reschedule appointment',
          '<div class="form-group"><label class="form-group__label" for="rs-date">New date</label><input class="form-input" type="date" id="rs-date" min="' +
            TODAY +
            '" max="' +
            LAST_DAY +
            '" value="' +
            a.date +
            '"></div>' +
            '<div class="form-group"><label class="form-group__label" for="rs-time">Time slot</label><select class="form-select" id="rs-time">' +
            opts +
            '</select></div><p class="form-group__error" id="rs-date-error" hidden></p>',
          'Save new schedule',
          function (d) {
            var nd = $('#rs-date', d).value,
              err = $('#rs-date-error', d),
              bad = '';
            if (!nd || nd < TODAY || nd > LAST_DAY)
              bad =
                'Choose a date between ' +
                shortDate(TODAY) +
                ' and ' +
                shortDate(LAST_DAY) +
                '.';
            else if (nd !== a.date && dayCount(nd) >= LIMIT) {
              var n = nextOpen(nd);
              bad =
                longDate(nd) +
                ' is full.' +
                (n ? ' The next available date is ' + longDate(n) + '.' : '');
            }
            if (bad) {
              err.textContent = bad;
              err.hidden = false;
              return false;
            }
            update(id, function (r) {
              r.c[1] = nd + ' ' + to24($('#rs-time', d).value);
              r.c[5] = 'Reserved';
            });
            toast('Appointment rescheduled.');
          }
        );
      }
    });
    draw();
  }

  function registerPetPage() {
    var form = $('#register-form');
    if (!form || !$('#pet-name')) return;
    var s = session(),
      acc =
        accounts().filter(function (a) {
          return a.email === s.email;
        })[0] || {};
    $('#owner-name').value = acc.name || s.name;
    if (acc.mobile) $('#owner-contact').value = acc.mobile;
    if (acc.address) $('#owner-address').value = acc.address;
    var addBtn = $('#add-owner'),
      extra = $('#extra-owner'),
      extraIds = ['extra-name', 'extra-relation', 'extra-contact'];
    addBtn.onclick = function () {
      extra.hidden = false;
      addBtn.hidden = true;
      addBtn.setAttribute('aria-expanded', 'true');
      $('#extra-name').focus();
    };
    $('#remove-owner').onclick = function () {
      extra.hidden = true;
      addBtn.hidden = false;
      addBtn.setAttribute('aria-expanded', 'false');
      extraIds.forEach(function (i) {
        $('#' + i).value = '';
        clearErr($('#' + i));
      });
    };
    $('#pet-name').addEventListener('input', function () {
      $('#duplicate-warning').hidden = true;
      $('#duplicate-confirm').checked = false;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true,
        f = function (id) {
          return $('#' + id);
        };
      function need(id, test, msg) {
        clearErr(f(id));
        if (!test(f(id).value.trim())) {
          setErr(f(id), msg);
          ok = false;
        }
      }
      var filled = function (v) {
          return v !== '';
        },
        phone = function (v) {
          return /^\d{11}$/.test(v.replace(/\s/g, ''));
        };
      need('pet-name', filled, 'Enter your pet\u2019s name.');
      need('pet-species', filled, 'Select a species.');
      need('pet-breed', filled, 'Enter the breed, or write Mixed or Unknown.');
      need(
        'pet-birthday',
        function (v) {
          return v !== '' && v <= new Date().toISOString().slice(0, 10);
        },
        'Enter a birthday that is not in the future.'
      );
      need('pet-color', filled, 'Enter your pet\u2019s color.');
      need('owner-name', filled, 'Enter your full name.');
      need('owner-address', filled, 'Enter your address.');
      need('owner-contact', phone, 'Enter a contact number with 11 digits.');
      var g = $('input[name="gender"]:checked', form),
        ge = f('pet-gender-error');
      ge.hidden = !!g;
      ge.textContent = g ? '' : 'Select your pet\u2019s gender.';
      if (!g) ok = false;
      var extraOn = !extra.hidden;
      if (extraOn) {
        need('extra-name', filled, 'Enter the person\u2019s full name.');
        need('extra-relation', filled, 'Select the relationship to the pet.');
        need('extra-contact', phone, 'Enter a contact number with 11 digits.');
      }
      if (!ok) {
        var bad = $('[aria-invalid="true"]', form) || ge;
        if (bad.focus) bad.focus();
        return;
      }

      var name = f('pet-name').value.trim(),
        species = f('pet-species').value,
        ownerName = f('owner-name').value.trim(),
        contact = f('owner-contact').value.replace(/\s/g, '');
      var people = [{ name: ownerName, rel: 'Owner', contact: contact }];
      if (extraOn)
        people.push({
          name: f('extra-name').value.trim(),
          rel: f('extra-relation').value,
          contact: f('extra-contact').value.replace(/\s/g, '')
        });
      var dup = rows('patient-record-list').filter(function (r) {
        return (
          r.c[1].toLowerCase() === name.toLowerCase() &&
          r.c[3].toLowerCase() === species.toLowerCase() &&
          (r.m.owner === s.email ||
            (r.m.people || []).some(function (p) {
              return people.some(function (q) {
                return q.contact === p.contact;
              });
            }))
        );
      })[0];
      if (dup && !$('#duplicate-confirm').checked) {
        $('#duplicate-text').textContent =
          'A ' +
          species.toLowerCase() +
          ' named ' +
          dup.c[1] +
          ' (Pet ID ' +
          dup.c[0] +
          ') is already linked to you or to one of the people you entered.';
        $('#duplicate-warning').hidden = false;
        $('#duplicate-error').hidden = false;
        $('#duplicate-confirm').focus();
        return;
      }
      $('#duplicate-warning').hidden = true;

      var pets = rows('patient-record-list'),
        pid = nextId('patient-record-list');
      pets.push({
        c: [pid, name, ownerName, species, '-'],
        m: {
          owner: s.email,
          breed: f('pet-breed').value.trim(),
          gender: g.value,
          birthday: f('pet-birthday').value,
          color: f('pet-color').value.trim(),
          appearance: f('pet-appearance').value.trim(),
          people: people
        }
      });
      saveRows('patient-record-list', pets);
      var cl = rows('client-list'),
        mine = cl.filter(function (r) {
          return r.c[3].toLowerCase() === s.email.toLowerCase();
        })[0];
      if (mine) mine.c[4] = (mine.c[4] ? mine.c[4] + ', ' : '') + name;
      else
        cl.push({
          c: [nextId('client-list') || 'C-2041', ownerName, contact, s.email, name],
          m: {}
        });
      saveRows('client-list', cl);
      saveAccounts(
        accounts().map(function (a) {
          if (a.email === s.email) {
            a.address = f('owner-address').value.trim();
            a.mobile = a.mobile || contact;
          }
          return a;
        })
      );

      $('#register-success').hidden = false;
      $('#register-actions').hidden = true;
      $('#register-success p:nth-of-type(2)').insertAdjacentHTML(
        'beforeend',
        ' <a href="portal-register-pet.html">Register another pet</a>.'
      );
      $$('input,select,textarea,button', form).forEach(function (x) {
        if (!x.closest('#register-success')) x.disabled = true;
      });
      $('#register-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function bookPage() {
    var form = $('#booking-form');
    if (!form) return;
    var pets = myPets(),
      saved = false;
    if (!pets.length) {
      $('#pet-choice').hidden = true;
      $('#pet-missing').hidden = true;
      $('#no-pets').hidden = false;
    } else {
      $('#pet-choice-list').innerHTML = pets
        .map(function (r) {
          return (
            '<label class="choice"><input type="radio" name="pet" value="' +
            esc(r.c[1]) +
            '" required aria-describedby="pet-error"><span class="choice__title">' +
            esc(r.c[1]) +
            '</span></label>'
          );
        })
        .join('');
      var want = new URLSearchParams(location.search).get('pet'),
        rb = $$('input[name="pet"]', form).filter(function (x) {
          return x.value === want;
        })[0];
      if (rb) rb.checked = true;
    }
    buildCalendar();
    form.addEventListener('submit', function () {
      setTimeout(function () {
        // runs after the page's own script has shown "Booking confirmed"
        if (saved || $('#booking-success').hidden) return;
        saved = true;
        var s = session(),
          all = rows('appointment-list'),
          pet = $('input[name="pet"]:checked', form).value,
          service = $('input[name="service"]:checked', form).value;
        all.push({
          c: [
            nextId('appointment-list'),
            $('#appt-date').value + ' ' + to24($('#appt-time').value),
            pet,
            s.name,
            service,
            'Reserved'
          ],
          m: { owner: s.email }
        });
        saveRows('appointment-list', all);
        toast('Appointment saved.');
      }, 0);
    });
  }

  /* Month calendar: choose any month of the current year; days fill up from stored bookings */
  function buildCalendar() {
    var cal = $('.calendar'),
      grid = cal && $('.calendar__grid', cal),
      title = $('#cal-title');
    if (!grid) return;
    var view = NOW.getMonth(),
      selected = null;
    title.insertAdjacentHTML(
      'afterend',
      '<div class="calendar__nav"><button type="button" class="btn btn--outline btn--small" id="cal-prev" aria-label="Previous month">&lsaquo;</button>' +
        '<select class="form-select" id="cal-month" aria-label="Choose a month of ' +
        YEAR +
        '">' +
        MONTHS.map(function (m, i) {
          return '<option value="' + i + '">' + m + ' ' + YEAR + '</option>';
        }).join('') +
        '</select><button type="button" class="btn btn--outline btn--small" id="cal-next" aria-label="Next month">&rsaquo;</button></div>'
    );
    var sel = $('#cal-month'),
      prev = $('#cal-prev'),
      next = $('#cal-next');
    function draw() {
      Array.prototype.slice.call(grid.children).forEach(function (c) {
        if (!c.classList.contains('calendar__dow')) c.remove();
      });
      var html = '',
        blanks = new Date(YEAR, view, 1).getDay(),
        total = new Date(YEAR, view + 1, 0).getDate(),
        i;
      for (i = 0; i < blanks; i++) html += '<span aria-hidden="true"></span>';
      for (i = 1; i <= total; i++) {
        var id = YEAR + '-' + pad(view + 1) + '-' + pad(i),
          label = MONTHS[view] + ' ' + i + ', ' + YEAR,
          num = '<span class="calendar__num">' + i + '</span>';
        if (id < TODAY)
          html +=
            '<button type="button" class="calendar__day is-past" data-date="' +
            id +
            '" aria-disabled="true" aria-label="' +
            label +
            ', past">' +
            num +
            '</button>';
        else if (dayCount(id) >= LIMIT)
          html +=
            '<button type="button" class="calendar__day is-full" data-date="' +
            id +
            '" aria-disabled="true" aria-label="' +
            label +
            ', full">' +
            num +
            '<span class="calendar__flag">Full</span></button>';
        else
          html +=
            '<button type="button" class="calendar__day' +
            (id === selected ? ' is-selected' : '') +
            '" data-date="' +
            id +
            '" aria-pressed="' +
            (id === selected) +
            '" aria-label="' +
            label +
            '">' +
            num +
            '</button>';
      }
      grid.insertAdjacentHTML('beforeend', html);
      title.textContent = MONTHS[view] + ' ' + YEAR;
      sel.value = String(view);
      prev.disabled = view === 0;
      next.disabled = view === 11;
    }
    sel.addEventListener('change', function () {
      view = +sel.value;
      draw();
    });
    prev.addEventListener('click', function () {
      if (view > 0) view--;
      draw();
    });
    next.addEventListener('click', function () {
      if (view < 11) view++;
      draw();
    });
    window.PawSyncCal = {
      isFull: function (id) {
        return dayCount(id) >= LIMIT;
      },
      sync: function (id) {
        // called by the booking page when a date is chosen, typed, or suggested
        selected = id || null;
        if (id && id.slice(0, 4) === String(YEAR)) view = +id.slice(5, 7) - 1;
        draw();
      }
    };
    draw();
  }

  /* ---------- Staff system ---------- */
  function staffCommon() {
    var s = session(),
      u = $('.topbar__user');
    if (u) {
      u.textContent = s.label || s.name;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--outline btn--small';
      b.textContent = 'Log out';
      b.onclick = logout;
      u.insertAdjacentElement('afterend', b);
    }
    addResetLink();
  }
  function isLow(r) {
    return +r.c[3] <= +r.c[4];
  }

  function staffDashboard() {
    var tb = $('#today-appointments');
    if (!tb) return;
    var today = rows('appointment-list')
      .filter(function (r) {
        return r.c[1].slice(0, 10) === TODAY && !/cancel/i.test(r.c[5]);
      })
      .sort(function (a, b) {
        return a.c[1] < b.c[1] ? -1 : 1;
      });
    tb.innerHTML =
      today
        .map(function (r) {
          return (
            '<tr><td>' +
            to12(r.c[1].slice(11)) +
            '</td><td>' +
            esc(r.c[2]) +
            '</td><td>' +
            esc(r.c[3]) +
            '</td><td>' +
            esc(r.c[4]) +
            '</td><td>' +
            badge(r.c[5]) +
            '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="5">No appointments today.</td></tr>';
    var n = $$('.card--stat .card__number');
    if (n.length > 2) {
      n[0].textContent = today.length;
      n[1].textContent = rows('confined-pet-list').length;
      n[2].textContent = rows('inventory-list').filter(isLow).length;
    }
  }

  function staffTablePage() {
    var tb = $('main tbody[id]'),
      fs = $('.staff-entry');
    if (!tb || !fs || tb.id === 'today-appointments') return;
    var id = tb.id,
      table = tb.closest('table'),
      head = $('thead tr', table),
      ths = $$('th', head),
      fields = $$('input,select', fs),
      editing = -1;
    var idCol = /id|invoice/i.test(ths[0].textContent);
    head.insertAdjacentHTML('beforeend', '<th scope="col">Actions</th>');
    var intro = $('.text-muted');
    if (intro)
      intro.innerHTML = intro.innerHTML.replace(
        'This static demo does not submit or save entered values.',
        'Entries are saved in this browser only (prototype).'
      );
    var help = $('.form-group__help', fs);
    if (help)
      help.textContent =
        'Saved in this browser only. Edit or delete rows from the table.';
    if (id === 'appointment-list') {
      var st = $('select', fs);
      st.insertAdjacentHTML('afterbegin', '<option>Reserved</option>');
      st.selectedIndex = 1;
    }
    fields.forEach(function (f) {
      f.insertAdjacentHTML('afterend', '<p class="form-group__error" hidden></p>');
    });
    fs.insertAdjacentHTML(
      'beforeend',
      '<div class="form-actions"><button type="button" class="btn btn--primary" data-save>Save entry</button><button type="button" class="btn btn--outline" data-clear>Clear</button></div>'
    );
    $('.table-wrap', tb.closest('section')).insertAdjacentHTML(
      'beforebegin',
      '<div class="form-group ps-search"><label class="form-group__label" for="ps-search">Search this list</label><input class="form-input" type="search" id="ps-search"></div><p class="ps-bar"><button type="button" class="btn btn--outline btn--small" id="ps-export">Export CSV</button></p>'
    );
    var saveBtn = $('[data-save]', fs),
      search = $('#ps-search');
    $('#ps-export').onclick = function () {
      downloadCSV(
        'pawsync-' + id.replace(/-list$/, '') + '-' + TODAY + '.csv',
        ths.slice(0, -1).map(function (th) {
          return th.textContent.trim();
        }),
        rows(id).map(function (r) {
          return r.c;
        })
      );
    };

    function err(f, msg) {
      var e = f.nextElementSibling;
      e.textContent = msg || '';
      e.hidden = !msg;
      if (msg) f.setAttribute('aria-invalid', 'true');
      else f.removeAttribute('aria-invalid');
    }
    function draw() {
      var q = search.value.toLowerCase();
      tb.innerHTML =
        rows(id)
          .map(function (r, i) {
            if (q && r.c.join(' ').toLowerCase().indexOf(q) < 0) return '';
            return (
              '<tr>' +
              r.c
                .map(function (v, j) {
                  var th = ths[j],
                    cell = /status/i.test(th.textContent) ? badge(v) : esc(v);
                  if (id === 'inventory-list' && j === 3 && isLow(r))
                    cell += ' ' + badge('Low stock');
                  return (
                    '<td' +
                    (th.classList.contains('table__num') ? ' class="table__num"' : '') +
                    '>' +
                    cell +
                    '</td>'
                  );
                })
                .join('') +
              '<td class="ps-actions"><button type="button" class="btn btn--link btn--small" data-edit="' +
              i +
              '">Edit</button> <button type="button" class="btn btn--link btn--small" data-del="' +
              i +
              '">Delete</button></td></tr>'
            );
          })
          .join('') ||
        '<tr><td colspan="' + (ths.length + 1) + '">No entries found.</td></tr>';
    }
    function clearForm() {
      fields.forEach(function (f) {
        if (f.tagName === 'SELECT') f.selectedIndex = id === 'appointment-list' ? 1 : 0;
        else f.value = '';
        err(f);
      });
      editing = -1;
      saveBtn.textContent = 'Save entry';
      var n = idCol ? nextId(id) : '';
      if (n) fields[0].value = n;
    }
    saveBtn.onclick = function () {
      var vals = [],
        ok = true,
        all = rows(id);
      fields.forEach(function (f, j) {
        var v = f.value.trim(),
          msg = '';
        if (!v) msg = 'This field is required.';
        else if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v))
          msg = 'Enter a valid email, like name@example.com.';
        else if (f.type === 'tel' && !/^[0-9 +()\-]{7,}$/.test(v))
          msg = 'Enter a valid phone number.';
        else if (f.type === 'number' && (isNaN(+v) || +v < 0))
          msg = 'Enter a number that is 0 or higher.';
        else if (
          j === 0 &&
          idCol &&
          all.some(function (r, i) {
            return i !== editing && r.c[0].toLowerCase() === v.toLowerCase();
          })
        )
          msg = 'This ID is already used.';
        if (f.type === 'datetime-local') v = v.replace('T', ' ');
        if (f.type === 'number' && f.step === '0.01' && !msg)
          v = (+v).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        if (id === 'appointment-list' && j === 1 && !msg) {
          var d = v.slice(0, 10),
            old = editing >= 0 ? all[editing].c[1].slice(0, 10) : '';
          if (d !== old && dayCount(d) >= LIMIT && !/cancel/i.test(fields[5].value))
            msg =
              longDate(d) +
              ' has reached the ' +
              LIMIT +
              '-patient limit. Pick another date' +
              (nextOpen(d) ? ' (next open: ' + shortDate(nextOpen(d)) + ').' : '.');
        }
        err(f, msg);
        if (msg) ok = false;
        vals.push(v);
      });
      if (!ok) {
        var bad = $('[aria-invalid="true"]', fs);
        if (bad) bad.focus();
        return;
      }
      if (editing >= 0) all[editing].c = vals;
      else {
        var row = { c: vals, m: {} };
        if (NEWEST_FIRST[id]) all.unshift(row);
        else all.push(row);
      }
      saveRows(id, all);
      toast(editing >= 0 ? 'Entry updated.' : 'Entry saved.');
      clearForm();
      draw();
    };
    $('[data-clear]', fs).onclick = clearForm;
    search.addEventListener('input', draw);
    tb.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]'),
        del = e.target.closest('[data-del]'),
        all = rows(id);
      if (ed) {
        editing = +ed.dataset.edit;
        var r = all[editing];
        fields.forEach(function (f, j) {
          var v = r.c[j];
          if (f.type === 'datetime-local') v = v.replace(' ', 'T');
          if (f.type === 'number') v = v.replace(/,/g, '');
          if (
            f.tagName === 'SELECT' &&
            !$$('option', f).some(function (o) {
              return o.textContent === v;
            })
          )
            f.insertAdjacentHTML('beforeend', '<option>' + esc(v) + '</option>');
          f.value = v;
          err(f);
        });
        saveBtn.textContent = 'Update entry';
        fs.closest('details').open = true;
        fields[0].focus();
        fs.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (del && confirm('Delete this entry?')) {
        all.splice(+del.dataset.del, 1);
        saveRows(id, all);
        toast('Entry deleted.');
        draw();
      }
    });
    clearForm();
    draw();
  }

  /* ---------- Export (CSV and print) ---------- */
  function csvCell(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function downloadCSV(name, headers, data) {
    var lines = [headers].concat(data).map(function (r) {
      return r.map(csvCell).join(',');
    });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    }); // BOM so Excel reads it correctly
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
    toast('Downloaded ' + name);
  }
  function money(v) {
    return parseFloat(String(v).replace(/,/g, '')) || 0;
  }
  function peso(n) {
    return n.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function buildReport(type, month) {
    // month: '' = whole year, otherwise '01'..'12'
    var ym = month ? YEAR + '-' + month : String(YEAR),
      inRange = function (d) {
        return String(d).indexOf(ym) === 0;
      },
      pick = function (id, col) {
        return rows(id).filter(function (r) {
          return !col && col !== 0 ? true : inRange(r.c[col]);
        });
      },
      r;
    if (type === 'sales') {
      r = pick('invoice-list', 2);
      var paid = 0,
        owed = 0;
      r.forEach(function (x) {
        if (/^paid$/i.test(x.c[4])) paid += money(x.c[3]);
        else owed += money(x.c[3]);
      });
      return {
        title: 'Sales summary',
        headers: ['Invoice', 'Customer / Pet', 'Date', 'Total (PHP)', 'Status'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary:
          'Invoices: ' +
          r.length +
          ' | Paid: PHP ' +
          peso(paid) +
          ' | Unpaid or partial: PHP ' +
          peso(owed) +
          ' | Grand total: PHP ' +
          peso(paid + owed)
      };
    }
    if (type === 'appointments') {
      r = pick('appointment-list', 1);
      var by = {};
      r.forEach(function (x) {
        by[x.c[5]] = (by[x.c[5]] || 0) + 1;
      });
      return {
        title: 'Appointment summary',
        headers: ['ID', 'Date and time', 'Patient', 'Client', 'Service', 'Status'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary:
          'Appointments: ' +
          r.length +
          (r.length
            ? ' | ' +
              Object.keys(by)
                .map(function (k) {
                  return k + ': ' + by[k];
                })
                .join(', ')
            : '')
      };
    }
    if (type === 'inventory') {
      r = rows('inventory-list').filter(isLow);
      return {
        title: 'Inventory reorder list',
        headers: ['Item ID', 'Item', 'Category', 'On hand', 'Reorder level'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary: 'Items at or below the reorder level: ' + r.length
      };
    }
    if (type === 'patients') {
      r = rows('patient-record-list');
      return {
        title: 'Patient list',
        headers: ['Pet ID', 'Pet', 'Client', 'Species', 'Last visit'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary: 'Patients on record: ' + r.length
      };
    }
    r = rows('client-list');
    return {
      title: 'Client list',
      headers: ['Client ID', 'Name', 'Contact', 'Email', 'Pets'],
      rows: r.map(function (x) {
        return x.c;
      }),
      summary: 'Clients on record: ' + r.length
    };
  }

  function reportExportPage() {
    var tb = $('#report-list'),
      host = tb && tb.closest('section');
    if (!host) return;
    host.insertAdjacentHTML(
      'afterend',
      '<section class="card ps-section" id="ps-report-area" aria-labelledby="ps-export-title"><h2 id="ps-export-title">Export a report (demo)</h2>' +
        '<p class="text-muted">Built from the data saved in this browser. Download it as a CSV file (opens in Excel) or print it / save it as PDF.</p>' +
        '<div class="ps-export-controls"><div class="form-group"><label class="form-group__label" for="ps-rep-type">Report</label><select class="form-select" id="ps-rep-type">' +
        '<option value="sales">Sales summary</option><option value="appointments">Appointment summary</option><option value="inventory">Inventory reorder list</option><option value="patients">Patient list</option><option value="clients">Client list</option></select></div>' +
        '<div class="form-group"><label class="form-group__label" for="ps-rep-month">Period (' +
        YEAR +
        ')</label><select class="form-select" id="ps-rep-month"><option value="">Whole year</option>' +
        MONTHS.map(function (m, i) {
          return '<option value="' + pad(i + 1) + '">' + m + '</option>';
        }).join('') +
        '</select></div></div>' +
        '<div class="ps-bar"><button type="button" class="btn btn--primary" id="ps-rep-csv">Download CSV</button><button type="button" class="btn btn--outline" id="ps-rep-print">Print / Save as PDF</button></div>' +
        '<div id="ps-rep-preview" class="ps-section" aria-live="polite"></div></section>'
    );
    var typeSel = $('#ps-rep-type'),
      monthSel = $('#ps-rep-month'),
      box = $('#ps-rep-preview');
    monthSel.value = pad(NOW.getMonth() + 1);
    function current() {
      return buildReport(
        typeSel.value,
        /^(patients|clients|inventory)$/.test(typeSel.value) ? '' : monthSel.value
      );
    }
    function draw() {
      monthSel.disabled = /^(patients|clients|inventory)$/.test(typeSel.value);
      var rep = current(),
        label =
          monthSel.disabled || !monthSel.value
            ? monthSel.disabled
              ? 'Current data'
              : 'Whole year ' + YEAR
            : MONTHS[+monthSel.value - 1] + ' ' + YEAR;
      box.innerHTML =
        '<h3>' +
        esc(rep.title) +
        ' - ' +
        esc(label) +
        '</h3><p class="text-muted">Generated ' +
        new Date().toLocaleString('en-PH') +
        '</p><p><strong>' +
        esc(rep.summary) +
        '</strong></p>' +
        '<div class="table-wrap"><table class="table"><thead><tr>' +
        rep.headers
          .map(function (h) {
            return '<th scope="col">' + esc(h) + '</th>';
          })
          .join('') +
        '</tr></thead><tbody>' +
        (rep.rows.length
          ? rep.rows
              .map(function (r) {
                return (
                  '<tr>' +
                  r
                    .map(function (v) {
                      return '<td>' + esc(v) + '</td>';
                    })
                    .join('') +
                  '</tr>'
                );
              })
              .join('')
          : '<tr><td colspan="' +
            rep.headers.length +
            '">No records for this period.</td></tr>') +
        '</tbody></table></div>';
    }
    typeSel.addEventListener('change', draw);
    monthSel.addEventListener('change', draw);
    $('#ps-rep-csv').onclick = function () {
      var rep = current();
      downloadCSV(
        'pawsync-' +
          typeSel.value +
          '-' +
          (monthSel.disabled || !monthSel.value ? YEAR : YEAR + '-' + monthSel.value) +
          '.csv',
        rep.headers,
        rep.rows
      );
    };
    $('#ps-rep-print').onclick = function () {
      document.body.classList.add('ps-print-report');
      window.print();
    };
    window.addEventListener('afterprint', function () {
      document.body.classList.remove('ps-print-report');
    });
    draw();
  }

  /* ---------- Sticky header helpers ---------- */
  function stickyHelpers() {
    function measure() {
      var el =
        $('.site-header') ||
        $('.portal-header') ||
        (window.innerWidth >= 1024 ? $('.topbar') : $('.sidebar'));
      document.documentElement.style.setProperty(
        '--header-h',
        (el ? Math.ceil(el.getBoundingClientRect().height) : 0) + 'px'
      );
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    var links = $$('.nav__link[href^="#"]'),
      targets = links
        .map(function (a) {
          return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
        })
        .filter(function (x) {
          return x.el;
        });
    if (targets.length < 2) return;
    function spy() {
      var line =
          (parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
            10
          ) || 0) + 24,
        cur = targets[0];
      targets.forEach(function (x) {
        if (x.el.getBoundingClientRect().top <= line) cur = x;
      });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4)
        cur = targets[targets.length - 1];
      links.forEach(function (a) {
        a.classList.toggle('is-active', a === cur.a);
        if (a === cur.a) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* ---------- Start ---------- */
  function init() {
    if (!guard()) return;
    var s = session();
    stickyHelpers();
    publicPages();
    loginPage();
    if (s && /^portal/.test(page)) {
      portalCommon();
      dashboardPage();
      myPetsPage();
      myAppointmentsPage();
      registerPetPage();
      bookPage();
    }
    if (s && /^staff/.test(page)) {
      staffCommon();
      staffDashboard();
      staffTablePage();
      reportExportPage();
    }
  }
  window.PawSync = { reset: resetDemo, logout: logout };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
