/* =========================================================
   SYNTAX-DESIGNS PORTFOLIO — INTERACTIONS
   ========================================================= */

window.tailwind = window.tailwind || {};
window.tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#FF6B2B',
        'accent-light': '#FF8F5C'
      }
    }
  }
};

(function () {
  'use strict';

  const reducedMotion = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
      dark: false,
      mm: false,
      sc: false,
      s: 'hero',

      confirmationOpen: false,
      submitted: false,
      submitError: '',
      upworkStatus: '',
      submitting: false,

      init() {
        this.initTheme();
        this.initReveal();
        this.updateSection();

        window.addEventListener(
          'scroll',
          () => {
            this.sc = window.scrollY > 20;
            this.updateSection();
          },
          { passive: true }
        );

        window.addEventListener(
          'resize',
          () => this.updateSection(),
          { passive: true }
        );

        document
          .getElementById('yr')
          ?.replaceChildren(String(new Date().getFullYear()));
      },

      initTheme() {
        const saved = localStorage.getItem('theme');

        this.dark =
          saved === 'dark' ||
          (!saved &&
            window.matchMedia?.(
              '(prefers-color-scheme: dark)'
            ).matches);

        document.documentElement.classList.toggle(
          'dark',
          this.dark
        );
      },

      toggleDark() {
        this.dark = !this.dark;

        document.documentElement.classList.toggle(
          'dark',
          this.dark
        );

        localStorage.setItem(
          'theme',
          this.dark ? 'dark' : 'light'
        );
      },

      closeMenu() {
        this.mm = false;
      },

      scrollTo(id) {
        const el = document.getElementById(id);

        if (!el) return;

        const top =
          el.getBoundingClientRect().top +
          window.scrollY -
          72;

        window.scrollTo({
          top,
          behavior: reducedMotion()
            ? 'auto'
            : 'smooth'
        });

        this.mm = false;
      },

      initReveal() {
        const items =
          document.querySelectorAll('.reveal');

        if (
          !('IntersectionObserver' in window) ||
          reducedMotion()
        ) {
          items.forEach(el =>
            el.classList.add('in')
          );

          return;
        }

        const observer =
          new IntersectionObserver(
            entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('in');

                  observer.unobserve(
                    entry.target
                  );
                }
              });
            },
            {
              threshold: 0.1,
              rootMargin:
                '0px 0px -30px 0px'
            }
          );

        items.forEach(el =>
          observer.observe(el)
        );
      },

      updateSection() {
        const ids = [
          'hero',
          'services',
          'work',
          'process',
          'about',
          'stack',
          'reviews',
          'blog',
          'contact'
        ];

        const marker =
          window.scrollY + 150;

        let current = 'hero';

        ids.forEach(id => {
          const el =
            document.getElementById(id);

          if (
            el &&
            el.offsetTop <= marker
          ) {
            current = id;
          }
        });

        this.s = current;
      },

      openConfirmation() {
        const form =
          this.$refs.contactForm;

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        this.submitError = '';
        this.submitted = false;
        this.confirmationOpen = true;

        document.body.classList.add(
          'modal-open'
        );
      },

      closeConfirmation() {
        this.confirmationOpen = false;
        this.submitted = false;
        this.submitError = '';

        document.body.classList.remove(
          'modal-open'
        );
      },

      async sendInquiry(channel) {
        if (this.submitting) return;

        const form =
          this.$refs.contactForm;

        const formData =
          new FormData(form);

        const isUpwork =
          channel === 'upwork';

        formData.set(
          'upwork_status',
          isUpwork
            ? 'Requested via Upwork'
            : 'Meeting requested'
        );

        this.submitting = true;
        this.submitError = '';

        try {
          const response =
            await fetch(form.action, {
              method:
                form.method || 'POST',

              body: formData,

              headers: {
                Accept:
                  'application/json'
              }
            });

          if (!response.ok) {
            throw new Error(
              'Form submission failed'
            );
          }

          form.reset();
          this.upworkStatus = '';

          if (isUpwork) {
            window.location.assign(
              'https://www.upwork.com/'
            );

            return;
          }

          this.submitted = true;
        } catch (error) {
          console.error(error);

          this.submitError =
            'Your message could not be sent. Please try again.';
        } finally {
          this.submitting = false;
        }
      }
    }));
  });


  /* =========================================================
     BLOG CAROUSEL
     ========================================================= */

  function initBlogSlider() {
    const carousel =
      document.getElementById(
        'default-carousel'
      );

    const wrapper =
      document.getElementById(
        'blogCarousel'
      );

    if (
      !carousel ||
      !wrapper ||
      window.blogSlider
    ) {
      return;
    }

    const slides = [
      ...wrapper.querySelectorAll(
        '[data-carousel-item]'
      )
    ];

    const indicators = [
      ...carousel.querySelectorAll(
        '[data-carousel-slide-to]'
      )
    ];

    const prev =
      carousel.querySelector(
        '[data-carousel-prev]'
      );

    const next =
      carousel.querySelector(
        '[data-carousel-next]'
      );

    if (!slides.length) return;


    const slider = {
      index: 0,

      timer: null,

      interval: 5500,

      paused: false,

      pausedUntil: 0,

      touchX: 0,

      touchY: 0,


      syncHeight() {
        const active =
          slides[this.index];

        if (!active) return;

        const article =
          active.querySelector(
            'article'
          );

        if (!article) return;

        requestAnimationFrame(() => {
          const height =
            Math.max(
              article.offsetHeight + 32,
              window.innerWidth < 640
                ? 470
                : 410
            );

          wrapper.style.height =
            `${height}px`;
        });
      },


      show(
        index,
        direction = 1
      ) {
        const count =
          slides.length;

        this.index =
          (index + count) %
          count;

        slides.forEach(
          (slide, i) => {
            const active =
              i === this.index;

            slide.classList.toggle(
              'blog-slide-active',
              active
            );

            slide.setAttribute(
              'aria-hidden',
              String(!active)
            );

            slide.style.transform =
              active
                ? 'none'
                : `translateX(${
                    direction > 0
                      ? 28
                      : -28
                  }px)`;
          }
        );

        indicators.forEach(
          (dot, i) => {
            const active =
              i === this.index;

            dot.setAttribute(
              'aria-current',
              String(active)
            );

            dot.classList.toggle(
              'bg-accent',
              active
            );

            dot.classList.toggle(
              'bg-zinc-300',
              !active
            );

            dot.classList.toggle(
              'dark:bg-zinc-600',
              !active
            );
          }
        );

        this.syncHeight();
      },


      move(direction) {
        if (
          slides.length < 2
        ) {
          return;
        }

        this.show(
          this.index + direction,
          direction
        );

        this.restart();
      },


      pause() {
        this.paused = true;

        clearTimeout(
          this.timer
        );
      },


      resume() {
        this.paused = false;

        this.restart();
      },


      restart() {
        clearTimeout(
          this.timer
        );

        if (
          reducedMotion() ||
          this.paused
        ) {
          return;
        }

        this.timer =
          setTimeout(() => {
            if (
              document.hidden ||
              Date.now() <
                this.pausedUntil
            ) {
              this.restart();

              return;
            }

            this.move(1);
          }, this.interval);
      },


          userInteraction() {
        this.pausedUntil =
          Date.now() + 4500;
      }
    };


    window.blogSlider =
      slider;


    /* Previous / next */

    prev?.addEventListener(
      'click',
      () => {
        slider.userInteraction();
        slider.move(-1);
      }
    );

    next?.addEventListener(
      'click',
      () => {
        slider.userInteraction();
        slider.move(1);
      }
    );


    /* Indicators */

    indicators.forEach(
      (dot, i) => {
        dot.addEventListener(
          'click',
          () => {
            slider.userInteraction();

            const direction =
              i >= slider.index
                ? 1
                : -1;

            slider.show(
              i,
              direction
            );

            slider.restart();
          }
        );
      }
    );


    /* Keyboard */

    carousel.addEventListener(
      'keydown',
      event => {
        if (
          event.key ===
          'ArrowLeft'
        ) {
          event.preventDefault();

          slider.userInteraction();

          slider.move(-1);
        }

        if (
          event.key ===
          'ArrowRight'
        ) {
          event.preventDefault();

          slider.userInteraction();

          slider.move(1);
        }

        if (
          event.key ===
          'Home'
        ) {
          event.preventDefault();

          slider.show(0, -1);

          slider.userInteraction();

          slider.restart();
        }

        if (
          event.key ===
          'End'
        ) {
          event.preventDefault();

          slider.show(
            slides.length - 1,
            1
          );

          slider.userInteraction();

          slider.restart();
        }
      }
    );


    /* Pause while interacting */

    carousel.addEventListener(
      'mouseenter',
      () => slider.pause()
    );

    carousel.addEventListener(
      'mouseleave',
      () => slider.resume()
    );

    carousel.addEventListener(
      'focusin',
      () => slider.pause()
    );

    carousel.addEventListener(
      'focusout',
      event => {
        if (
          !carousel.contains(
            event.relatedTarget
          )
        ) {
          slider.resume();
        }
      }
    );


    /* Touch / swipe */

    wrapper.addEventListener(
      'touchstart',
      event => {
        const touch =
          event.changedTouches[0];

        slider.touchX =
          touch.clientX;

        slider.touchY =
          touch.clientY;
      },
      {
        passive: true
      }
    );

    wrapper.addEventListener(
      'touchend',
      event => {
        const touch =
          event.changedTouches[0];

        const dx =
          touch.clientX -
          slider.touchX;

        const dy =
          touch.clientY -
          slider.touchY;

        if (
          Math.abs(dx) < 45 ||
          Math.abs(dx) <
            Math.abs(dy)
        ) {
          return;
        }

        slider.userInteraction();

        slider.move(
          dx < 0
            ? 1
            : -1
        );
      },
      {
        passive: true
      }
    );


    /* Tab visibility */

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          slider.pause();
        } else {
          slider.resume();
        }
      }
    );


    /* Resize */

    window.addEventListener(
      'resize',
      () => slider.syncHeight(),
      {
        passive: true
      }
    );


    /* Image loading */

    slides.forEach(
      slide => {
        slide
          .querySelectorAll('img')
          .forEach(img => {
            if (!img.complete) {
              img.addEventListener(
                'load',
                () =>
                  slider.syncHeight(),
                {
                  once: true
                }
              );
            }
          });
      }
    );


    /* Initial state */

    slider.show(0, 1);

    slider.restart();
  }


  /* =========================================================
     BACKWARD COMPATIBILITY
     ========================================================= */

  window.scrollBlog =
    direction => {
      if (!window.blogSlider) {
        return;
      }

      window.blogSlider
        .userInteraction();

      window.blogSlider
        .move(direction);
    };


  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initBlogSlider
    );
  } else {
    initBlogSlider();
  }

})();