(function () {
  const sessionValue = sessionStorage.getItem('pawsyncSession');
  let session = null;

  try {
    session = JSON.parse(sessionValue || 'null');
  } catch (error) {
    session = null;
  }

  const page = window.location.pathname.split('/').pop().toLowerCase();
  const isOwnerPage = page.startsWith('portal');
  const isStaffPage = page.startsWith('staff');
  const requiredRole = isOwnerPage ? 'owner' : isStaffPage ? 'staff' : null;

  if (requiredRole && (!session || session.role !== requiredRole)) {
    window.location.href = 'login.html';
    return;
  }

  if (session && session.role === 'owner') {
    document.querySelectorAll('.portal-header__greeting').forEach(function (greeting) {
      greeting.textContent = 'Hi, ' + session.name.split(' ')[0] + '!';
    });
  }

  if (session && session.role === 'staff') {
    document.querySelectorAll('.topbar__user').forEach(function (greeting) {
      greeting.textContent = session.name;
    });
  }
})();
