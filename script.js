/* =========================================================
   FULL PORTFOLIO JAVASCRIPT
   ========================================================= */

window.tailwind = window.tailwind || {};

window.tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#FF6B2B',
        'accent-light': '#FF8A55'
      }
    }
  }
};


/* =========================================================
   MAIN APPLICATION
   ========================================================= */

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

    init() {

      /*
       * DARK MODE
       */

      const storedTheme =
        localStorage.getItem('theme');

      if (storedTheme === 'dark') {
        this.dark = true;
        document.documentElement.classList.add('dark');
      } else if (storedTheme === 'light') {
        this.dark = false;
        document.documentElement.classList.remove('dark');
      } else {
        this.dark =
          window.matchMedia &&
          window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;

        document.documentElement.classList.toggle(
          'dark',
          this.dark
        );
      }


      /*
       * SCROLL NAVIGATION
       */

      window.addEventListener(
        'scroll',
        () => {
          this.sc =
            window.scrollY > 20;

          this.updateSection();
        },
        { passive: true }
      );


      /*
       * REVEAL ANIMATIONS
       */

      const revealElements =
        document.querySelectorAll('.reveal');

      if (
        'IntersectionObserver' in window &&
        !window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
      ) {

        const observer =
          new IntersectionObserver(
            entries => {

              entries.forEach(entry => {

                if (
                  entry.isIntersecting
                ) {

                  entry.target.classList.add(
                    'in'
                  );

                  observer.unobserve(
                    entry.target
                  );
                }

              });

            },
            {
              threshold: 0.12
            }
          );

        revealElements.forEach(
          element => {
            observer.observe(element);
          }
        );

      } else {

        /*
         * Fallback:
         * reveal everything immediately.
         */

        revealElements.forEach(
          element => {
            element.classList.add('in');
          }
        );
      }


      /*
       * INITIAL SECTION
       */

      this.updateSection();
    },


    /*
     * TOGGLE DARK MODE
     */

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


    /*
     * MOBILE MENU
     */

    closeMenu() {
      this.mm = false;
    },


    /*
     * SCROLL TO SECTION
     */

    scrollTo(id) {

      const element =
        document.getElementById(id);

      if (!element) return;

      const offset = 80;

      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        offset;

      window.scrollTo({
        top,
        behavior: 'smooth'
      });

      this.mm = false;
    },


    /*
     * CONTACT FORM
     */

    submitting: false,

    openConfirmation() {
      const form = this.$refs.contactForm;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      this.submitError = '';
      this.submitted = false;
      this.confirmationOpen = true;
    },

    closeConfirmation() {
      this.confirmationOpen = false;
      this.submitted = false;
      this.submitError = '';
    },

    async sendInquiry(channel) {
      if (this.submitting) return;

      const form = this.$refs.contactForm;
      const formData = new FormData(form);
      const isUpwork = channel === 'upwork';

      formData.set(
        'upwork_status',
        isUpwork ? 'Requested via Upwork' : 'Meeting requested'
      );

      this.submitting = true;
      this.submitError = '';

      try {
        const response = await fetch(form.action, {
          method: form.method || 'POST',
          body: formData,
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }

        form.reset();
        this.upworkStatus = '';

        if (isUpwork) {
          window.location.assign('https://www.upwork.com/');
          return;
        }

        this.submitted = true;
      } catch (error) {
        console.error(error);
        this.submitError = 'Your message could not be sent. Please try again.';
      } finally {
        this.submitting = false;
      }
    },


    /* =====================================================
       ACTIVE NAVIGATION SECTION
       ===================================================== */

    updateSection() {

      const bottomReached =
        window.innerHeight +
        window.scrollY >=
        document.body.scrollHeight - 80;

      if (bottomReached) {

        this.s = 'contact';

        return;
      }

      const sections = [
        'contact',
        'blog',
        'reviews',
        'about',
        'work',
        'services',
        'hero'
      ];

      for (const id of sections) {

        const element =
          document.getElementById(id);

        if (!element) continue;

        const offset =
          element.offsetTop - 140;

        if (window.scrollY >= offset) {

          this.s = id;

          return;
        }
      }
    }
  }));

});


/* =========================================================
   BLOG CAROUSEL
   ========================================================= */

function scrollBlog(direction) {

  const slider =
    window.blogSlider;

  if (!slider) return;

  slider.pausedUntil =
    Date.now() + 4500;

  slider.move(direction);
}


/* =========================================================
   INITIALIZE BLOG SLIDER
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

  const slides =
    Array.from(
      wrapper.querySelectorAll(
        '[data-carousel-item]'
      )
    );

  const indicators =
    Array.from(
      carousel.querySelectorAll(
        '[data-carousel-slide-to]'
      )
    );

  if (!slides.length) return;


  const slider = {

    carousel,
    wrapper,
    slides,
    indicators,

    index: 0,

    timer: null,

    animating: false,

    pausedUntil: 0,

    interval: 5000,

    animationDuration: 700,


    /*
     * SHOW SLIDE
     */

    show(nextIndex) {

      const count =
        this.slides.length;

      this.index =
        (nextIndex + count) % count;


      this.slides.forEach(
        (slide, i) => {

          const active =
            i === this.index;

          slide.classList.toggle(
            'hidden',
            !active
          );

          slide.setAttribute(
            'aria-hidden',
            String(!active)
          );
        }
      );


      this.indicators.forEach(
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
    },


    /*
     * MOVE
     */

    move(direction) {

      if (
        this.animating ||
        this.slides.length < 2
      ) {
        return;
      }

      this.animating = true;

      this.show(
        this.index + direction
      );

      const reducedMotion =
        window.matchMedia &&
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

      window.setTimeout(
        () => {

          this.animating = false;

          this.restart();

        },
        reducedMotion
          ? 0
          : this.animationDuration
      );
    },


    /*
     * AUTOPLAY
     */

    restart() {

      window.clearTimeout(
        this.timer
      );

      this.timer =
        window.setTimeout(
          () => {

            if (
              document.hidden ||
              Date.now() <
                this.pausedUntil
            ) {

              this.restart();

              return;
            }

            this.move(1);

          },
          this.interval
        );
    },


    /*
     * PAUSE
     */

    pause() {

      window.clearTimeout(
        this.timer
      );
    },


    /*
     * KEYBOARD
     */

    handleKeydown(event) {

      if (
        event.key ===
        'ArrowLeft'
      ) {

        event.preventDefault();

        this.pausedUntil =
          Date.now() + 4500;

        this.move(-1);

      } else if (
        event.key ===
        'ArrowRight'
      ) {

        event.preventDefault();

        this.pausedUntil =
          Date.now() + 4500;

        this.move(1);

      } else if (
        event.key === 'Home'
      ) {

        event.preventDefault();

        this.pausedUntil =
          Date.now() + 4500;

        this.show(0);

        this.restart();

      } else if (
        event.key === 'End'
      ) {

        event.preventDefault();

        this.pausedUntil =
          Date.now() + 4500;

        this.show(
          this.slides.length - 1
        );

        this.restart();
      }
    }
  };


  /*
   * GLOBAL REFERENCE
   */

  window.blogSlider =
    slider;


  /*
   * INDICATORS
   */

  indicators.forEach(
    (dot, index) => {

      dot.addEventListener(
        'click',
        () => {

          slider.pausedUntil =
            Date.now() + 4500;

          slider.show(index);

          slider.restart();
        }
      );
    }
  );


  /*
   * KEYBOARD
   */

  carousel.addEventListener(
    'keydown',
    event =>
      slider.handleKeydown(event)
  );


  /*
   * MOUSE PAUSE
   */

  carousel.addEventListener(
    'mouseenter',
    () => slider.pause()
  );

  carousel.addEventListener(
    'mouseleave',
    () => slider.restart()
  );


  /*
   * FOCUS PAUSE
   */

  carousel.addEventListener(
    'focusin',
    () => slider.pause()
  );

  carousel.addEventListener(
    'focusout',
    () => slider.restart()
  );


  /*
   * TOUCH / SWIPE
   */

  let touchStartX = 0;
  let touchStartY = 0;


  wrapper.addEventListener(
    'touchstart',
    event => {

      const touch =
        event.changedTouches[0];

      touchStartX =
        touch.clientX;

      touchStartY =
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
        touchStartX;

      const dy =
        touch.clientY -
        touchStartY;


      if (
        Math.abs(dx) < 45 ||
        Math.abs(dx) <
          Math.abs(dy)
      ) {
        return;
      }


      slider.pausedUntil =
        Date.now() + 4500;


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


  /*
   * TAB VISIBILITY
   */

  document.addEventListener(
    'visibilitychange',
    () =>
      document.hidden
        ? slider.pause()
        : slider.restart()
  );


  /*
   * INITIAL SLIDE
   */

  slider.show(0);


  /*
   * REDUCED MOTION
   */

  if (
    window.matchMedia &&
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) {

    slider.pause();

  } else {

    slider.restart();
  }
}


/* =========================================================
   START BLOG SLIDER
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