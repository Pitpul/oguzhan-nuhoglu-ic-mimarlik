/* Genel site davranışları: header, mobil menü, hero video, ortak scroll-reveal & stagger, ana sayfa gerçek katmanlı scroll, SSS akordeonu */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  var root = document.documentElement;
  var activeObservers = [];

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Smoothstep eğrisi: 0-1 aralığında başlangıç ve bitişi yumuşatır
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // --- 1. Header: kaydırınca gölge ---
  var header = document.getElementById('site-header');
  function updateHeader(scrollY) {
    if (header) header.classList.toggle('is-scrolled', scrollY > 40);
  }

  // --- 2. Mobil menü ---
  var toggle = document.getElementById('menu-toggle');
  var drawer = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!toggle || !drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    root.classList.toggle('overflow-hidden', open);
    var iconOpen = toggle.querySelector('[data-icon-open]');
    var iconClose = toggle.querySelector('[data-icon-close]');
    if (iconOpen && iconClose) {
      iconOpen.classList.toggle('hidden', open);
      iconClose.classList.toggle('hidden', !open);
    }
  }
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    drawer.querySelectorAll('.mobile-link').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }
  var subToggle = document.getElementById('mobile-sub-toggle');
  var subMenu = document.getElementById('mobile-sub-menu');
  if (subToggle && subMenu) {
    subToggle.addEventListener('click', function () {
      var open = subToggle.getAttribute('aria-expanded') !== 'true';
      subToggle.setAttribute('aria-expanded', String(open));
      subMenu.classList.toggle('hidden', !open);
      var arrow = subToggle.querySelector('[data-sub-arrow]');
      if (arrow) arrow.classList.toggle('rotate-180', open);
    });
  }

  // --- 3. Ortak Stagger & Geri Sarılabilir Scroll Reveal Sistemi (Tüm Sayfalar) ---
  var staggerGroups = document.querySelectorAll('[data-stagger]');
  function applyStaggerDelays() {
    var mobile = window.innerWidth < 768;
    staggerGroups.forEach(function (group) {
      var step = parseInt(group.getAttribute('data-stagger'), 10) || 70;
      if (mobile) step = Math.round(step * 0.65);
      var maxDelay = mobile ? 150 : 250;
      var children = group.querySelectorAll(':scope > .reveal, :scope > div > .reveal, :scope > li.reveal, :scope > article.reveal, :scope > a.reveal');
      children.forEach(function (el, idx) {
        var delay = Math.min(idx * step, maxDelay);
        el.style.setProperty('--reveal-delay', delay + 'ms');
      });
    });
  }
  applyStaggerDelays();

  var revealEls = document.querySelectorAll('.reveal');
  var revealObserver = null;

  function initRevealSystem() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (!('IntersectionObserver' in window) || !revealEls.length) {
      root.classList.remove('js-ready');
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var vh = window.innerHeight;
    // İlk ekranda olan öğeleri hemen görünür işaretle
    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) {
        el.classList.add('is-visible');
      }
    });
    root.classList.add('js-ready');

    revealObserver = new IntersectionObserver(function (entries) {
      var curVh = window.innerHeight;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else if (entry.boundingClientRect.top > curVh * 0.94) {
          // Kullanıcı yukarı kaydırıp öğe tekrar ekranın altına indiğinde animasyon geri sarılır
          entry.target.classList.remove('is-visible');
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
    activeObservers.push(revealObserver);
  }
  initRevealSystem();

  // --- 4. Hero Video: kesintisiz otomatik oynatma, mobil uyumluluk ve poster fallback ---
  var video = document.querySelector('[data-hero-video]');
  if (video) {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    var saveData = connection.saveData === true;

    video.defaultMuted = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    function hideVideoShowFallback() {
      video.pause();
      video.classList.add('hidden');
    }

    function tryPlayVideo() {
      if (saveData || video.classList.contains('hidden')) return;
      video.muted = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          // Tarayıcı düşük güç modunda otomatik oynatmayı bekletirse poster görünür kalır
        });
      }
    }

    var sources = video.querySelectorAll('source');
    var failedSources = 0;
    sources.forEach(function (srcEl) {
      srcEl.addEventListener('error', function () {
        failedSources += 1;
        if (failedSources >= sources.length) hideVideoShowFallback();
      });
    });
    video.addEventListener('error', hideVideoShowFallback);

    if (saveData) {
      hideVideoShowFallback();
    } else {
      if (video.readyState >= 2) {
        tryPlayVideo();
      } else {
        video.addEventListener('loadeddata', tryPlayVideo, { once: true });
        video.addEventListener('canplay', tryPlayVideo, { once: true });
      }
      tryPlayVideo();

      var unlockEvents = ['touchstart', 'click'];
      var unlockHandler = function () {
        if (video.paused && !video.classList.contains('hidden')) tryPlayVideo();
        unlockEvents.forEach(function (evt) {
          window.removeEventListener(evt, unlockHandler);
        });
      };
      unlockEvents.forEach(function (evt) {
        window.addEventListener(evt, unlockHandler, { once: true, passive: true });
      });

      if ('IntersectionObserver' in window) {
        var heroSection = document.getElementById('hero');
        if (heroSection) {
          var videoVisObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                tryPlayVideo();
              } else if (!video.paused) {
                video.pause();
              }
            });
          }, { threshold: 0.01 });
          videoVisObserver.observe(heroSection);
          activeObservers.push(videoVisObserver);
        }
      }
    }
  }

  // --- 5. Ana Sayfa: Gerçek Katmanlı Bölüm Geçişleri (Sticky Stacking) & Görsel Parallax ---
  // Masaüstü (>= 768px): Her bölüm kendi doğal yüksekliği sonunda sticky olarak kalır, yeni bölüm
  // onun üzerine yükselirken önceki bölüm scale 1 -> 0.972 ve translateY 0 -> -16px ile geriye çekilir.
  // Yeni bölüm ekranın tepesine ulaştığında (tam örtüşme) arkada kalan bölüm gizlenerek taşma yapmaz.
  // Mobil (< 768px): Yalnızca Hero sticky kalır; uzun içerikli bölümler doğal akışta hafifçe (1 -> 0.986, -8px) geçiş yapar.
  var stack = document.querySelector('[data-scroll-stack]');
  var layerSections = stack ? Array.prototype.slice.call(stack.querySelectorAll('[data-layer-section]')) : [];
  var heroBg = document.querySelector('[data-hero-bg]');
  var scrollIndicator = document.querySelector('[data-scroll-indicator]');
  var parallaxMediaEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax-media]'));

  var layers = layerSections.map(function (sec, idx) {
    sec.style.zIndex = String(idx + 1);
    return {
      el: sec,
      inner: sec.querySelector('[data-layer-inner]'),
      isHero: sec.id === 'hero',
      top: 0,
      height: 0,
      stickyTop: 0,
      lastProgress: -1,
      isHidden: false
    };
  });

  var parallaxItems = parallaxMediaEls.map(function (el) {
    var parentSec = el.closest('[data-layer-section]');
    var parentLayer = null;
    if (parentSec) {
      for (var k = 0; k < layers.length; k++) {
        if (layers[k].el === parentSec) {
          parentLayer = layers[k];
          break;
        }
      }
    }
    return {
      el: el,
      layer: parentLayer,
      range: parseFloat(el.getAttribute('data-parallax-media')) || 14,
      top: 0,
      height: 0
    };
  });

  var viewportHeight = window.innerHeight;
  var isMobileViewport = window.innerWidth < 768;

  // DOM ölçümleri her karede değil; yalnızca yükleme ve boyut değişiminde (resize) önbelleğe alınır.
  // Sticky sınıfı (.is-layered) sökülüp takılmadan ardışık bölüm yükseklikleriyle doğal top konumu hesaplanır;
  // böylece sayfa yüklenirken veya ResizeObserver tetiklendiğinde scroll container sarsıntısı ve scrollbar tetiklenmesi oluşmaz.
  function measureLayout() {
    var scrollY = window.scrollY || window.pageYOffset || 0;
    viewportHeight = window.innerHeight;
    isMobileViewport = window.innerWidth < 768;

    var runningTop = stack ? stack.getBoundingClientRect().top + scrollY : 0;

    for (var i = 0; i < layers.length; i++) {
      var h = layers[i].el.offsetHeight || layers[i].el.getBoundingClientRect().height;
      // Bölüm ekran yüksekliğinden uzunsa, içeriğin sonuna ulaşıldığında sticky olacak negatif top değeri
      var stickyTop = Math.min(0, viewportHeight - h);
      layers[i].top = runningTop;
      layers[i].height = h;
      layers[i].stickyTop = stickyTop;
      layers[i].lastProgress = -1;
      layers[i].el.style.setProperty('--sticky-top', stickyTop + 'px');
      runningTop += h;
    }

    for (var j = 0; j < parallaxItems.length; j++) {
      var item = parallaxItems[j];
      var pRect = item.el.getBoundingClientRect();
      if (item.layer) {
        var secRect = item.layer.el.getBoundingClientRect();
        item.top = item.layer.top + (pRect.top - secRect.top);
      } else {
        item.top = pRect.top + scrollY;
      }
      item.height = pRect.height;
    }

    if (stack && !stack.classList.contains('is-layered')) {
      stack.classList.add('is-layered');
    }
  }

  function resetAllTransforms() {
    if (stack) stack.classList.remove('is-layered');
    for (var i = 0; i < layers.length; i++) {
      layers[i].el.style.visibility = '';
      layers[i].isHidden = false;
      if (layers[i].inner) {
        layers[i].inner.style.transform = '';
        layers[i].inner.style.opacity = '';
      }
      layers[i].lastProgress = 0;
    }
    if (heroBg) heroBg.style.transform = '';
    if (scrollIndicator) scrollIndicator.style.opacity = '';
    for (var j = 0; j < parallaxItems.length; j++) {
      parallaxItems[j].el.style.removeProperty('--parallax-y');
      parallaxItems[j].el.style.removeProperty('--parallax-scale');
    }
  }

  function renderScrollFrame() {
    var scrollY = window.scrollY || window.pageYOffset || 0;
    updateHeader(scrollY);

    var vh = viewportHeight;
    var scaleDrop = isMobileViewport ? 0.014 : 0.028; // 1 -> 0.986 (mobil) | 1 -> 0.972 (masaüstü)
    var maxShiftY = isMobileViewport ? 8 : 16;        // 0 -> -8px  (mobil) | 0 -> -16px (masaüstü)
    var maxFade = isMobileViewport ? 0.04 : 0.08;     // 1 -> 0.96  (mobil) | 1 -> 0.92  (masaüstü)

    // A) Bölümler arası gerçek katmanlı geçiş (Hero->Stüdyo, Stüdyo->Projeler, Projeler->Hizmetler, Hizmetler->Yaklaşım, Yaklaşım->İletişim, İletişim->Manifesto)
    for (var i = 0; i < layers.length - 1; i++) {
      var current = layers[i];
      var next = layers[i + 1];

      var nextViewportTop = next.top - scrollY;
      // Örtüşme mesafesi: bölüm ekran yüksekliğinden kısaysa kendi yüksekliği kadar, uzunsa vh kadar
      var overlapSpan = Math.max(1, Math.min(vh, current.height));
      var rawProgress = 1 - nextViewportTop / overlapSpan;
      var progress = clamp(rawProgress, 0, 1);

      // Sonraki bölüm ekranın en tepesine (nextViewportTop <= 0) ulaştığında ve arkadaki bölümü tamamen
      // örttüğünde (son kısa manifesto bölümü hariç), arkada kalan sticky bölümü gizle ki kısa bölümlerin altından taşmasın
      var isLastTransition = i === layers.length - 2;
      var shouldHide = !isMobileViewport && !isLastTransition && nextViewportTop <= 0;
      if (current.isHero && nextViewportTop <= 0) shouldHide = true;

      if (shouldHide !== current.isHidden) {
        current.isHidden = shouldHide;
        current.el.style.visibility = shouldHide ? 'hidden' : '';
      }

      if (!current.inner || progress === current.lastProgress) continue;
      current.lastProgress = progress;

      if (progress <= 0.0005) {
        current.inner.style.transform = '';
        current.inner.style.opacity = '';
        if (current.isHero) {
          if (heroBg) heroBg.style.transform = '';
          if (scrollIndicator) scrollIndicator.style.opacity = '';
        }
      } else {
        var eased = smoothstep(progress);
        var scale = (1 - eased * scaleDrop).toFixed(4);
        var translateY = (-eased * maxShiftY).toFixed(2);
        var opacity = (1 - eased * maxFade).toFixed(3);

        current.inner.style.transform =
          'translate3d(0,' + translateY + 'px,0) scale3d(' + scale + ',' + scale + ',1)';
        current.inner.style.opacity = opacity;

        if (current.isHero) {
          if (heroBg) {
            var bgY = (-eased * (isMobileViewport ? 6 : 12)).toFixed(1);
            var bgScale = (1 + eased * 0.02).toFixed(4);
            heroBg.style.transform = 'translate3d(0,' + bgY + 'px,0) scale3d(' + bgScale + ',' + bgScale + ',1)';
          }
          if (scrollIndicator) {
            scrollIndicator.style.opacity = String(Math.max(0, 1 - progress * 2.4).toFixed(3));
          }
        }
      }
    }

    // B) Görsellerde hafif derinlik / parallax
    var imgScale = isMobileViewport ? '1.02' : '1.035';
    for (var j = 0; j < parallaxItems.length; j++) {
      var item = parallaxItems[j];
      var itemViewportTop = item.top - scrollY;
      var itemViewportBottom = itemViewportTop + item.height;
      if (itemViewportBottom < -40 || itemViewportTop > vh + 40) continue;

      var centerOffset = (itemViewportTop + item.height * 0.5 - vh * 0.5) / (vh * 0.65);
      var clamped = clamp(centerOffset, -1, 1);
      var effRange = isMobileViewport ? item.range * 0.5 : item.range;
      var py = (-clamped * effRange).toFixed(1);
      item.el.style.setProperty('--parallax-y', py + 'px');
      item.el.style.setProperty('--parallax-scale', imgScale);
    }
  }

  var rafId = null;
  function onScroll() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = null;
      renderScrollFrame();
    });
  }

  measureLayout();
  renderScrollFrame();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', function () {
    measureLayout();
    renderScrollFrame();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      applyStaggerDelays();
      measureLayout();
      renderScrollFrame();
    }, 100);
  }, { passive: true });

  if ('ResizeObserver' in window && layerSections.length) {
    var roTimer = null;
    var ro = new ResizeObserver(function () {
      var heightChanged = false;
      for (var i = 0; i < layers.length; i++) {
        if (Math.abs(layers[i].el.offsetHeight - layers[i].height) > 0.5) {
          heightChanged = true;
          break;
        }
      }
      if (!heightChanged) return;
      clearTimeout(roTimer);
      roTimer = setTimeout(function () {
        measureLayout();
        renderScrollFrame();
      }, 80);
    });
    layerSections.forEach(function (sec) { ro.observe(sec); });
    activeObservers.push(ro);
  }

  motionQuery.addEventListener('change', function (e) {
    reduceMotion = e.matches;
    measureLayout();
    renderScrollFrame();
  });

  // Sticky bölümlerde sayfa içi (#studyo, #hizmetlerimiz, #iletisim) linklerin doğal akış konumuna kaydırması
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      var targetId = hash.slice(1);
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].el.id === targetId) {
          e.preventDefault();
          window.scrollTo({
            top: Math.max(0, layers[i].top),
            behavior: reduceMotion ? 'auto' : 'smooth'
          });
          if (history.pushState) history.pushState(null, '', hash);
          break;
        }
      }
    });
  });

  // Sayfa değişimlerinde observer ve rAF temizliği
  window.addEventListener('pagehide', function () {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    activeObservers.forEach(function (obs) {
      if (obs && typeof obs.disconnect === 'function') obs.disconnect();
    });
    activeObservers = [];
  });

  // --- 6. SSS akordeonu (aynı anda tek madde açık) ---
  var faq = document.querySelector('[data-faq]');
  if (faq) {
    var buttons = faq.querySelectorAll('[data-faq-btn]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(function (b) {
          var open = b === btn && willOpen;
          b.setAttribute('aria-expanded', String(open));
          var panel = document.getElementById(b.getAttribute('aria-controls'));
          if (panel) panel.setAttribute('data-open', String(open));
          var icon = b.querySelector('[data-faq-icon]');
          if (icon) icon.textContent = open ? '×' : '+';
        });
      });
    });
  }
})();
