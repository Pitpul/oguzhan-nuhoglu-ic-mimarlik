/* İletişim formu: istemci tarafı doğrulama (yalnızca kullanıcı deneyimi), fetch ile gönderim ve KVKK modalı.
   Asıl doğrulama sunucu tarafındadır. */
(function () {
  'use strict';

  // --- KVKK modalı ---
  var modal = document.getElementById('kvkk-modal');
  if (modal) {
    document.querySelectorAll('[data-kvkk-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof modal.showModal === 'function') modal.showModal();
        else modal.setAttribute('open', '');
      });
    });
    modal.querySelectorAll('[data-kvkk-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof modal.close === 'function') modal.close();
        else modal.removeAttribute('open');
      });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal && typeof modal.close === 'function') modal.close();
    });
  }

  var form = document.querySelector('[data-contact-form]');
  if (!form) return;

  var alertBox = document.getElementById('form-alert');
  var successBox = document.getElementById('form-success');
  var submitBtn = form.querySelector('[data-submit]');
  var submitLabel = form.querySelector('[data-submit-label]');

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_CHARS = /^\+?[0-9\s()\-]+$/;

  function validate(data) {
    var errors = {};
    if (data.full_name.trim().length < 2) errors.full_name = 'Ad soyad alanı boş bırakılamaz.';
    if (!EMAIL.test(data.email.trim())) errors.email = 'Lütfen geçerli bir e-posta adresi giriniz.';
    var digits = data.phone.replace(/\D/g, '');
    if (!PHONE_CHARS.test(data.phone.trim()) || data.phone.trim().lastIndexOf('+') > 0 || digits.length < 10 || digits.length > 15) {
      errors.phone = 'Lütfen geçerli bir telefon numarası giriniz (örn. +90 532 000 00 00).';
    }
    if (data.message.length > 2000) errors.message = 'Mesaj en fazla 2000 karakter olabilir.';
    if (!data.kvkk_accepted) errors.kvkk_accepted = 'Devam edebilmek için KVKK Aydınlatma Metni onayı zorunludur.';
    return errors;
  }

  function showErrors(errors) {
    form.querySelectorAll('[data-error-for]').forEach(function (el) {
      var key = el.getAttribute('data-error-for');
      var input = form.elements[key];
      if (errors[key]) {
        el.textContent = errors[key];
        el.classList.remove('hidden');
        if (input) input.setAttribute('aria-invalid', 'true');
      } else {
        el.textContent = '';
        el.classList.add('hidden');
        if (input) input.removeAttribute('aria-invalid');
      }
    });
    var keys = Object.keys(errors);
    if (alertBox) {
      alertBox.textContent = keys.length ? 'Lütfen işaretli alanları kontrol ediniz.' : '';
      alertBox.classList.toggle('hidden', keys.length === 0);
    }
    if (keys.length && form.elements[keys[0]]) form.elements[keys[0]].focus();
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('opacity-60', loading);
    if (submitLabel) submitLabel.textContent = loading ? 'Gönderiliyor…' : 'Mesajı Gönder';
  }

  function collect() {
    return {
      full_name: form.elements.full_name.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      project_type: form.elements.project_type.value,
      message: form.elements.message.value,
      website: form.elements.website ? form.elements.website.value : '',
      kvkk_accepted: form.elements.kvkk_accepted.checked
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (successBox) successBox.classList.add('hidden');

    var data = collect();
    var errors = validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    fetch(form.getAttribute('action') || '/iletisim', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-csrf-token': form.elements._csrf ? form.elements._csrf.value : ''
      },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
      })
      .then(function (r) {
        if (r.status === 201 && r.body.success) {
          form.reset();
          showErrors({});
          if (successBox) {
            successBox.textContent = r.body.message;
            successBox.classList.remove('hidden');
            successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (r.status === 400 && r.body.errors) {
          showErrors(r.body.errors);
        } else if (r.status === 403) {
          showErrors({});
          if (alertBox) {
            alertBox.textContent = 'Güvenlik doğrulaması zaman aşımına uğradı. Lütfen sayfayı yenileyip tekrar deneyin.';
            alertBox.classList.remove('hidden');
          }
        } else {
          showErrors({});
          if (alertBox) {
            alertBox.textContent = r.body.message || 'Talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin.';
            alertBox.classList.remove('hidden');
          }
        }
      })
      .catch(function () {
        if (alertBox) {
          alertBox.textContent = 'Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.';
          alertBox.classList.remove('hidden');
        }
      })
      .then(function () { setLoading(false); });
  });
})();
