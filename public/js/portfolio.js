/* Proje filtreleme (sayfa yenilenmeden) */
(function () {
  'use strict';

  var group = document.querySelector('[data-filter-group]');
  var grid = document.getElementById('projects-grid');
  if (!group || !grid) return;

  var buttons = group.querySelectorAll('[data-filter]');
  var items = grid.querySelectorAll('[data-project-item]');
  var counter = document.querySelector('[data-visible-count]');
  var emptyState = document.querySelector('[data-filter-empty]');

  function apply(filter, isUserClick) {
    var visible = 0;
    items.forEach(function (item) {
      var show = filter === 'all' || item.getAttribute('data-category') === filter;
      item.classList.toggle('hidden', !show);
      if (show) {
        var delay = Math.min(visible * 65, 220);
        item.style.setProperty('--reveal-delay', delay + 'ms');
        visible += 1;
        if (isUserClick || filter !== 'all') {
          item.classList.add('is-visible');
          item.querySelectorAll('.reveal').forEach(function (inner) {
            inner.classList.add('is-visible');
          });
        }
      }
    });
    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-filter') === filter));
    });
    if (counter) counter.textContent = String(visible);
    if (emptyState) emptyState.classList.toggle('hidden', visible !== 0);

    if (window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (filter === 'all') url.searchParams.delete('kategori');
      else url.searchParams.set('kategori', filter);
      window.history.replaceState(null, '', url.toString());
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(btn.getAttribute('data-filter'), true);
    });
  });

  apply(grid.getAttribute('data-initial-filter') || 'all', false);
})();
