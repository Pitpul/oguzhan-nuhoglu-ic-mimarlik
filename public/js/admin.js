/* Admin paneli etkileşimleri (CSP gereği inline script kullanılmaz) */
(function () {
  'use strict';

  // Silme onayı
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // CRM: durum seçilince tek işlemle kaydet
  document.querySelectorAll('[data-autosubmit]').forEach(function (select) {
    select.addEventListener('change', function () {
      var form = select.closest('form');
      if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
      else if (form) form.submit();
    });
  });

  // Proje formu: görsel önizleme
  var fileInput = document.getElementById('image_file');
  var urlInput = document.getElementById('image_url');
  var preview = document.getElementById('image-preview');
  function showPreview(src) {
    if (!preview) return;
    if (src) {
      preview.src = src;
      preview.classList.remove('hidden');
    } else {
      preview.removeAttribute('src');
      preview.classList.add('hidden');
    }
  }
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (file) showPreview(URL.createObjectURL(file));
    });
  }
  if (urlInput) {
    urlInput.addEventListener('change', function () {
      if (!fileInput || !fileInput.files || !fileInput.files.length) showPreview(urlInput.value.trim());
    });
  }
})();
