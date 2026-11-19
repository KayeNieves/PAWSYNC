(function () {
  if (!window.PawSyncData) return;

  var configs = {
    'staff-appointments.html': {
      key: 'pawsyncStaffAppointments',
      fields: [
        ['appointment-id', 'id'], ['appointment-time', 'time'],
        ['appointment-patient', 'patient'], ['appointment-client', 'client'],
        ['appointment-service', 'service'], ['appointment-status', 'status']
      ],
      listId: 'appointment-list',
      columns: ['id', 'time', 'patient', 'client', 'service', 'status']
    },
    'staff-clients.html': {
      key: 'pawsyncClients',
      fields: [
        ['client-id', 'id'], ['client-name', 'name'], ['client-phone', 'phone'],
        ['client-email', 'email'], ['client-pets', 'pets']
      ],
      listId: 'client-list',
      columns: ['id', 'name', 'phone', 'email', 'pets']
    },
    'staff-confined-pets.html': {
      key: 'pawsyncConfinedPets',
      fields: [
        ['ward-id', 'id'], ['confined-patient', 'patient'], ['confined-client', 'client'],
        ['check-in', 'checkIn'], ['care-status', 'status']
      ],
      listId: 'confined-pet-list',
      columns: ['id', 'patient', 'client', 'checkIn', 'status']
    },
    'staff-inventory.html': {
      key: 'pawsyncInventory',
      fields: [
        ['item-id', 'id'], ['item-name', 'name'], ['item-category', 'category'],
        ['item-count', 'count'], ['item-reorder', 'reorder']
      ],
      listId: 'inventory-list',
      columns: ['id', 'name', 'category', 'count', 'reorder'],
      numericColumns: ['count', 'reorder']
    },
    'staff-billing.html': {
      key: 'pawsyncInvoices',
      fields: [
        ['invoice-id', 'id'], ['invoice-customer', 'customer'], ['invoice-date', 'date'],
        ['invoice-total', 'total'], ['invoice-status', 'status']
      ],
      listId: 'invoice-list',
      columns: ['id', 'customer', 'date', 'total', 'status'],
      numericColumns: ['total']
    },
    'staff-patient-records.html': {
      key: 'pawsyncPatientRecords',
      fields: [
        ['patient-id', 'id'], ['patient-name', 'name'], ['patient-client', 'client'],
        ['patient-species', 'species'], ['patient-visit', 'visit']
      ],
      listId: 'patient-record-list',
      columns: ['id', 'name', 'client', 'species', 'visit']
    },
    'staff-reports.html': {
      key: 'pawsyncReports',
      fields: [
        ['report-name', 'name'], ['report-period', 'period'], ['report-author', 'author'],
        ['report-updated', 'updated'], ['report-status', 'status']
      ],
      listId: 'report-list',
      columns: ['name', 'period', 'author', 'updated', 'status']
    },
    'staff-users.html': {
      key: 'pawsyncStaffUsers',
      fields: [
        ['staff-id', 'id'], ['staff-name', 'name'], ['staff-role', 'role'],
        ['staff-email', 'email'], ['staff-status', 'status']
      ],
      listId: 'staff-user-list',
      columns: ['id', 'name', 'role', 'email', 'status']
    }
  };

  var page = window.location.pathname.split('/').pop().toLowerCase();
  var config = configs[page];
  if (!config) return;

  var fieldset = document.querySelector('.staff-entry');
  if (fieldset) {
    var help = fieldset.querySelector('.form-group__help');
    if (help) {
      help.textContent = 'Saved locally in this browser.';
      var saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'btn btn--primary';
      saveButton.textContent = 'Save entry';
      fieldset.appendChild(saveButton);

      saveButton.addEventListener('click', function () {
        var record = {};
        var valid = true;
        config.fields.forEach(function (field) {
          var input = document.getElementById(field[0]);
          if (!input || !input.value.trim()) {
            valid = false;
            if (input) input.setAttribute('aria-invalid', 'true');
          } else {
            input.removeAttribute('aria-invalid');
            record[field[1]] = input.value.trim();
          }
        });
        if (!valid) return;

        var records = PawSyncData.get(config.key);
        records.push(record);
        PawSyncData.set(config.key, records);
        render();
        fieldset.querySelectorAll('input').forEach(function (input) { input.value = ''; });
        fieldset.querySelectorAll('select').forEach(function (select) { select.selectedIndex = 0; });
        saveButton.textContent = 'Entry saved';
        setTimeout(function () { saveButton.textContent = 'Save entry'; }, 1200);
      });
    }
  }

  function render() {
    var list = document.getElementById(config.listId);
    if (!list) return;
    var records = PawSyncData.get(config.key);
    records.forEach(function (record) {
      var existing = list.querySelector('[data-local-record="' + PawSyncData.escapeHtml(record.id || record.name) + '"]');
      if (existing) return;
      var row = document.createElement('tr');
      row.setAttribute('data-local-record', record.id || record.name);
      config.columns.forEach(function (column) {
        var cell = document.createElement('td');
        if (config.numericColumns && config.numericColumns.indexOf(column) !== -1) {
          cell.className = 'table__num';
          cell.textContent = column === 'total'
            ? Number(record[column] || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
            : record[column];
        } else {
          cell.textContent = record[column] || '';
        }
        row.appendChild(cell);
      });
      list.appendChild(row);
    });
  }

  render();
})();
