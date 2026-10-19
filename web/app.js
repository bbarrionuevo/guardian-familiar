// Verificador en el navegador: manda el texto o la captura a /api/analizar y muestra el resultado.
// También guarda en el teléfono el contacto de un familiar (nunca se manda al servidor) para
// llamarlo o escribirle con un toque cuando hay riesgo.
(function () {
  'use strict';

  var FAMILY_KEY = 'pausa-familiar';

  // El almacenamiento del navegador puede no estar (modo privado, datos borrados): todo con try.
  function loadFamily() {
    try {
      var v = JSON.parse(localStorage.getItem(FAMILY_KEY) || 'null');
      return v && v.nombre && v.telefono ? v : null;
    } catch (err) {
      return null;
    }
  }

  // Número con + y código de país: «+54 9 11 1234-5678» → «+5491112345678».
  function normalizePhone(value) {
    var t = String(value || '').replace(/[\s().\/-]/g, '');
    if (t.indexOf('00') === 0) t = '+' + t.slice(2);
    return /^\+[1-9]\d{7,14}$/.test(t) ? t : null;
  }

  // Completa los botones para llamar o escribir al familiar, o muestra el enlace para guardarlo.
  function updateFamily(block, level, label) {
    var setup = block.parentNode.querySelector('.family-setup');
    var risky = level === 'alto' || level === 'medio';
    var fam = risky ? loadFamily() : null;
    block.hidden = !fam;
    if (setup) setup.hidden = !risky || !!fam;
    if (!fam) return;
    function fill(template) {
      return template
        .replace(' ({label})', label ? ' (' + label + ')' : '')
        .split('{name}')
        .join(fam.nombre);
    }
    block.querySelector('.family-lead').textContent = fill(block.getAttribute('data-lead'));
    var call = block.querySelector('.call-btn');
    call.href = 'tel:' + fam.telefono;
    call.textContent = '📞 ' + fill(block.getAttribute('data-call'));
    var wa = block.querySelector('.wa-btn');
    wa.href = 'https://wa.me/' + fam.telefono.slice(1) + '?text=' + encodeURIComponent(fill(block.getAttribute('data-message')));
    wa.textContent = '💬 ' + fill(block.getAttribute('data-whatsapp'));
  }

  function setupFamilyForm(form) {
    var status = form.querySelector('.family-status');
    var name = form.querySelector('[name="nombre"]');
    var phone = form.querySelector('[name="telefono"]');
    var fam = loadFamily();
    if (fam) {
      name.value = fam.nombre;
      phone.value = fam.telefono;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = name.value.replace(/\s+/g, ' ').trim().slice(0, 40);
      var telefono = normalizePhone(phone.value);
      if (!nombre || !telefono) {
        status.textContent = form.getAttribute('data-invalid');
        return;
      }
      try {
        localStorage.setItem(FAMILY_KEY, JSON.stringify({ nombre: nombre, telefono: telefono }));
        phone.value = telefono;
        status.textContent = form.getAttribute('data-saved').split('{name}').join(nombre);
      } catch (err) {
        status.textContent = form.getAttribute('data-invalid');
      }
    });
    form.querySelector('[data-clear]').addEventListener('click', function () {
      try {
        localStorage.removeItem(FAMILY_KEY);
      } catch (err) {}
      name.value = '';
      phone.value = '';
      status.textContent = form.getAttribute('data-cleared');
    });
  }

  // Achica la captura antes de mandarla: menos datos y más rápido en el teléfono.
  function shrinkImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        var data = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ tipo: 'image/jpeg', base64: data.slice(data.indexOf(',') + 1) });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('imagen'));
      };
      img.src = url;
    });
  }

  function setupChecker(form) {
    var lang = form.getAttribute('data-lang') || 'es';
    var levels = JSON.parse(form.getAttribute('data-levels') || '{}');
    var shareTemplate = form.getAttribute('data-share') || '';
    var box = form.closest('.checker-box');
    var result = box.querySelector('.result');
    var pill = result.querySelector('.pill');
    var text = result.querySelector('.result-text');
    var share = result.querySelector('.share-wa');
    var family = result.querySelector('.family-actions');
    var fileInput = form.querySelector('.file-input');
    var fileName = form.querySelector('.file-name');
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button.textContent;
    var pastedImage = null;

    function chosen(name) {
      fileName.textContent = name ? form.getAttribute('data-chosen') + ' ' + name : '';
    }
    fileInput.addEventListener('change', function () {
      pastedImage = null;
      chosen(fileInput.files[0] ? fileInput.files[0].name : '');
    });
    // Pegar una captura con Ctrl+V también funciona.
    form.addEventListener('paste', function (e) {
      var items = (e.clipboardData && e.clipboardData.files) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          pastedImage = items[i];
          chosen(items[i].name || 'captura');
          e.preventDefault();
          return;
        }
      }
    });

    function show(level, body, pattern, label) {
      result.hidden = false;
      pill.className = 'pill ' + level;
      pill.textContent = levels[level] || '';
      // El nivel ya se ve en la etiqueta de color: se saca la primera línea («🔴 RIESGO ALTO…»).
      text.textContent = /^(🔴|🟡|🟢)/.test(body) ? body.replace(/^.*\n+/, '') : body;
      if (level !== 'sin_senales' && label) {
        var url = location.origin + '/' + lang + '/';
        share.href = 'https://wa.me/?text=' + encodeURIComponent(shareTemplate.replace('{label}', label).replace('{url}', url));
        share.hidden = false;
      } else {
        share.hidden = true;
      }
      if (family) updateFamily(family, level, label);
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var texto = form.querySelector('textarea').value.trim();
      var file = pastedImage || (fileInput.files && fileInput.files[0]);
      if (!texto && !file) {
        show('sin_senales', form.getAttribute('data-empty'), null, null);
        pill.textContent = '';
        pill.className = 'pill';
        return;
      }
      button.disabled = true;
      button.textContent = form.getAttribute('data-working');
      var imagePromise = file ? shrinkImage(file) : Promise.resolve(null);
      imagePromise
        .then(function (imagen) {
          return fetch('/api/analizar', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ texto: texto, idioma: lang, imagen: imagen }),
          });
        })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then(function (data) {
          show(data.nivel, data.respuesta, data.patron, data.etiqueta);
        })
        .catch(function () {
          result.hidden = false;
          pill.className = 'pill';
          pill.textContent = '';
          text.textContent = form.getAttribute('data-error');
          share.hidden = true;
          if (family) updateFamily(family, null, null);
        })
        .then(function () {
          button.disabled = false;
          button.textContent = buttonLabel;
        });
    });

    share.addEventListener('click', function () {
      try {
        navigator.sendBeacon('/api/evento', JSON.stringify({ tipo: 'compartir' }));
      } catch (err) {}
    });
  }

  document.querySelectorAll('form[data-checker]').forEach(setupChecker);
  document.querySelectorAll('form[data-family]').forEach(setupFamilyForm);
  // Página de resultado de «Compartir»: el nivel ya viene escrito en la página.
  document.querySelectorAll('.family-actions[data-level]').forEach(function (block) {
    updateFamily(block, block.getAttribute('data-level'), block.getAttribute('data-label'));
  });
  // «Cargar un mensaje de prueba» en la página para la familia.
  document.querySelectorAll('[data-fill]').forEach(function (button) {
    button.addEventListener('click', function () {
      var area = document.getElementById('mensaje');
      if (!area) return;
      area.value = button.getAttribute('data-fill');
      area.focus();
    });
  });

  // Botón «Instalar» cuando el navegador lo permite (Chrome en Android).
  var installEvent = null;
  var installBtn = document.querySelector('.install-btn');
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvent = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.then(function (choice) {
        if (choice.outcome === 'accepted') {
          installBtn.hidden = true;
          try {
            navigator.sendBeacon('/api/evento', JSON.stringify({ tipo: 'instalar' }));
          } catch (err) {}
        }
        installEvent = null;
      });
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
