// public/theme-setter.js
(function() {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === null || savedMode === 'true') {
    document.documentElement.classList.add('dark');
  }
})();