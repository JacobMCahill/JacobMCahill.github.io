document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initActiveNavLinks();
  initTypedStatus();
  initGalleries();
  initScrollReveal();
  initContactForm();
});

function initNavToggle() {
  const nav = document.getElementById('siteNav');
  const btn = document.getElementById('navToggle');
  if (!nav || !btn) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.textContent = isOpen ? '[x]' : '[ ]';
  });

  nav.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '[ ]';
    });
  });
}

function initActiveNavLinks() {
  const sections = document.querySelectorAll('main section[id]');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const setActiveLink = () => {
    const marker = window.scrollY + window.innerHeight * 0.3;
    let activeSection = sections[0];

    sections.forEach(section => {
      if (section.offsetTop <= marker) activeSection = section;
    });

    const id = activeSection.getAttribute('id');
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  window.addEventListener('scroll', setActiveLink, { passive: true });
  window.addEventListener('resize', setActiveLink);
  setActiveLink();
}

function initTypedStatus() {
  const target = document.getElementById('typed-status');
  if (!target) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const value = 'open to work';

  if (prefersReduced) {
    target.textContent = value;
    return;
  }

  let i = 0;
  target.textContent = '';
  const type = () => {
    if (i <= value.length) {
      target.textContent = value.slice(0, i);
      i++;
      setTimeout(type, 55);
    }
  };
  setTimeout(type, 700);
}

function initGalleries() {
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const main = gallery.querySelector('[data-main]');
    const thumbButtons = [...gallery.querySelectorAll('.gallery-thumbs button')];
    if (!main || !thumbButtons.length) return;

    const shots = [
      { src: main.getAttribute('src'), alt: main.getAttribute('alt') || 'Project homepage', thumb: null },
      ...thumbButtons.map(thumb => ({
        src: thumb.getAttribute('data-src'),
        alt: thumb.getAttribute('data-shot') || 'Screenshot',
        thumb,
      })),
    ];

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'gallery-dots';
    const dots = shots.map((shot, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show ${shot.alt}`);
      dot.addEventListener('click', () => showShot(index));
      dotsContainer.appendChild(dot);
      return dot;
    });
    gallery.appendChild(dotsContainer);

    let activeIndex = 0;

    function showShot(index) {
      const total = shots.length;
      activeIndex = ((index % total) + total) % total;
      const shot = shots[activeIndex];

      main.src = shot.src;
      main.alt = shot.alt;
      thumbButtons.forEach(t => t.classList.remove('active'));
      if (shot.thumb) shot.thumb.classList.add('active');
      dots.forEach(d => d.classList.remove('active'));
      dots[activeIndex].classList.add('active');
      gallery.dataset.galleryIndex = `${activeIndex + 1} / ${total}`;
    }

    showShot(0);

    main.addEventListener('click', (event) => {
      const rect = main.getBoundingClientRect();
      const clickedRightHalf = (event.clientX - rect.left) > rect.width / 2;
      showShot(activeIndex + (clickedRightHalf ? 1 : -1));
    });

    thumbButtons.forEach(thumb => {
      thumb.addEventListener('click', () => {
        showShot(shots.findIndex(s => s.thumb === thumb));
      });
    });
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  const fields = {
    name: { el: document.getElementById('name'), error: document.getElementById('error-name') },
    email: { el: document.getElementById('email'), error: document.getElementById('error-email') },
    message: { el: document.getElementById('message'), error: document.getElementById('error-message') },
  };

  function setError(key, msg) {
    const field = fields[key];
    const wrapper = document.getElementById(`field-${key}`);
    if (msg) {
      wrapper.classList.add('has-error');
      field.error.textContent = msg;
    } else {
      wrapper.classList.remove('has-error');
      field.error.textContent = '';
    }
  }

  function validate() {
    let valid = true;

    if (!fields.name.el.value.trim()) {
      setError('name', 'Please enter your name.');
      valid = false;
    } else {
      setError('name', '');
    }

    const emailVal = fields.email.el.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      setError('email', 'Please enter your email.');
      valid = false;
    } else if (!emailPattern.test(emailVal)) {
      setError('email', 'That email doesn\'t look right.');
      valid = false;
    } else {
      setError('email', '');
    }

    if (!fields.message.el.value.trim()) {
      setError('message', 'Add a short message.');
      valid = false;
    } else {
      setError('message', '');
    }

    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) {
      status.className = 'form-status show';
      status.style.color = 'var(--danger)';
      status.textContent = '$ error: please fix the fields above and try again';
      return;
    }

    submitBtn.textContent = 'sending...';
    submitBtn.disabled = true;
    status.className = 'form-status';

    try {
      const response = await fetch('https://formspree.io/f/mbdndlzq', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error('Form submission failed');

      status.className = 'form-status show success';
      status.textContent = `$ message sent - thanks, ${fields.name.el.value.trim().split(' ')[0]}. I'll reply soon.`;
      form.reset();
    } catch (error) {
      status.className = 'form-status show';
      status.style.color = 'var(--danger)';
      status.textContent = '$ error: message could not be sent. Please email me directly instead.';
    } finally {
      submitBtn.textContent = '$ send_message';
      submitBtn.disabled = false;
    }
  });
}
