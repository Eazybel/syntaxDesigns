window.tailwind = window.tailwind || {};
window.tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { display: ['PT Sans','sans-serif'], body: ['DM Sans','sans-serif'] },
      colors: { accent: '#FF6B2B', 'accent-light': '#FF8F5C' }
    }
  }
};

function app() {
  return {
    dark: false,
    mm: false,
    sc: false,
    s: 'hero',
    confirmationOpen: false,
    submitting: false,
    submitted: false,
    submitError: '',
    upworkStatus: '',

    init() {
      // dark mode
      this.dark = localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      this.$watch('dark', v => localStorage.setItem('theme', v ? 'dark' : 'light'));

      // scroll
      window.addEventListener('scroll', () => {
        this.sc = window.scrollY > 20;
        this.updateSection();
      }, { passive: true });

      // reveal
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));

      // year
      document.getElementById('yr').textContent = new Date().getFullYear();
    },

    openConfirmation() {
      if (!this.$refs.contactForm.reportValidity()) return;
      this.submitError = '';
      this.submitted = false;
      this.confirmationOpen = true;
      document.body.classList.add('modal-open');
    },

    closeConfirmation() {
      if (this.submitting) return;
      this.confirmationOpen = false;
      this.submitted = false;
      document.body.classList.remove('modal-open');
    },

    async sendInquiry(route) {
      this.submitting = true;
      this.submitError = '';
      this.upworkStatus = route === 'upwork' ? 'Upwork verified' : 'upwork-status_';

      try {
        const response = await fetch(this.$refs.contactForm.action, {
          method: 'POST',
          body: new FormData(this.$refs.contactForm),
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Formspree request failed');
        this.$refs.contactForm.reset();
        this.upworkStatus = '';
        if (route === 'upwork') {
          window.location.assign('https://www.upwork.com/freelancers/~01362d3f829f520be8');
          return;
        }
        this.submitted = true;
      } catch (error) {
        this.submitError = 'Something went wrong while sending your request. Please try again.';
      } finally {
        this.submitting = false;
      }
    },

    updateSection() {
      const atBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 60;
      if (atBottom) { this.s = 'contact'; return; }
      const ids = ['contact','blog','reviews','about','work','services','hero'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 130) { this.s = id; return; }
      }
    }
  }
}

function scrollBlog(direction) {
  const slider = window.blogSlider;
  if (!slider || slider.animating) return;
  slider.pausedUntil = Date.now() + 3500;
  slider.move(direction);
}

function initBlogSlider() {
  const carousel = document.getElementById('blogCarousel');
  if (!carousel || window.blogSlider) return;

  const originals = Array.from(carousel.querySelectorAll('article'));
  if (!originals.length) return;
  const total = originals.length;
  const before = originals.map(card => card.cloneNode(true));
  const after = originals.map(card => card.cloneNode(true));
  before.forEach(card => { card.classList.remove('reveal'); carousel.insertBefore(card, carousel.firstChild); });
  after.forEach(card => { card.classList.remove('reveal'); carousel.appendChild(card); });

  const slider = {
    carousel,
    total,
    index: total,
    animating: false,
    paused: false,
    pausedUntil: 0,
    timer: null,
    step() {
      const card = carousel.querySelector('article');
      const gap = parseFloat(getComputedStyle(carousel).columnGap || getComputedStyle(carousel).gap) || 24;
      return (card ? card.getBoundingClientRect().width : 0) + gap;
    },
    move(direction) {
      const nextIndex = this.index + direction;
      this.index = nextIndex;
      this.animating = true;
      carousel.scrollTo({ left: Math.round(nextIndex * this.step()), behavior: 'smooth' });
      window.setTimeout(() => {
        if (this.index >= this.total * 2) {
          this.index -= this.total;
          carousel.scrollTo({ left: Math.round(this.index * this.step()), behavior: 'auto' });
        } else if (this.index < this.total) {
          this.index += this.total;
          carousel.scrollTo({ left: Math.round(this.index * this.step()), behavior: 'auto' });
        }
        this.animating = false;
      }, 760);
    },
    schedule() {
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        if (!this.paused && Date.now() >= this.pausedUntil) this.move(1);
        this.schedule();
      }, 2000);
    }
  };

  window.blogSlider = slider;
  carousel.scrollLeft = Math.round(slider.index * slider.step());
  carousel.addEventListener('mouseenter', () => { slider.paused = true; });
  carousel.addEventListener('mouseleave', () => { slider.paused = false; slider.pausedUntil = Date.now() + 1000; });
  carousel.addEventListener('focusin', () => { slider.paused = true; });
  carousel.addEventListener('focusout', () => { slider.paused = false; slider.pausedUntil = Date.now() + 1000; });
  carousel.addEventListener('touchstart', () => {
    slider.animating = false;
    slider.paused = true;
  }, { passive: true });
  carousel.addEventListener('touchend', () => {
    window.setTimeout(() => {
      slider.index = Math.round(carousel.scrollLeft / slider.step());
      if (slider.index >= slider.total * 2) {
        slider.index -= slider.total;
        carousel.scrollTo({ left: Math.round(slider.index * slider.step()), behavior: 'auto' });
      } else if (slider.index < slider.total) {
        slider.index += slider.total;
        carousel.scrollTo({ left: Math.round(slider.index * slider.step()), behavior: 'auto' });
      }
      slider.paused = false;
      slider.pausedUntil = Date.now() + 1500;
    }, 150);
  }, { passive: true });
  window.addEventListener('resize', () => { carousel.scrollLeft = Math.round(slider.index * slider.step()); });
  slider.schedule();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogSlider);
} else {
  initBlogSlider();
}
