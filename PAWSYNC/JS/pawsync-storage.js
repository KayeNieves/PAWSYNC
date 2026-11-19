(function () {
  window.PawSyncData = {
    get: function (key, fallback) {
      try {
        var value = JSON.parse(localStorage.getItem(key));
        return value === null ? (fallback || []) : value;
      } catch (error) {
        return fallback || [];
      }
    },
    set: function (key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    escapeHtml: function (value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };
})();
