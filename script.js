/* =========================================================
   SYNTAX-DESIGNS PORTFOLIO
   Main JavaScript
   ========================================================= */

window.tailwind = window.tailwind || {};

window.tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['PT Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif']
      },
      colors: {
        accent: '#FF6B2B',
        'accent-light': '#FF8F5C'
      }
    }
  }
};


/* =========================================================
   MAIN ALPINE APP
   ========================================================= */

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

    /* -----------------------------------------------------
       INITIALIZATION
       ----------------------------------------------------- */

    init() {
      /* ---------------------------
         Dark mode
         --------------------------- */

      const savedTheme = localStorage.getItem('theme');

      this.dark =
        savedTheme === 'dark' ||
        (
          !savedTheme &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        );

      this.$watch('dark', value => {
        try {
          localStorage.setItem(
            'theme',
            value ? 'dark' : 'light'
          );
        } catch (_) {
          /* localStorage may be unavailable */
        }
      });


      /* ---------------------------
         Scroll state
         Performance optimized
         --------------------------- */

      let ticking = false;

      const handleScroll = () => {
        if (ticking) return;

        ticking = true;

        window.requestAnimationFrame(() => {
          this.sc = window.scrollY > 20;
          this.updateSection();
          ticking = false;
        });
      };

      window.addEventListener(
        'scroll',
        handleScroll,
        { passive: true }
      );


      /* ---------------------------
         Reveal animations
         --------------------------- */

      const revealElements =
        document.querySelectorAll('.reveal');

      if (
        'IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (!entry.isIntersecting) return;

              entry.target.classList.add('in');

              observer.unobserve(entry.target);
            });
          },
          {
            threshold: 0.08,
            rootMargin: '0px 0px -50px 0px'
          }
        );

        revealElements.forEach(element => {
          observer.observe(element);
        });
      } else {
        /*
         * If the browser doesn't support IntersectionObserver
         * or the user prefers reduced motion, reveal everything.
         */
        revealElements.forEach(element => {
          element.classList.add('in');
        });
      }


      /* ---------------------------
         Current year
         --------------------------- */

      const yearElement =
        document.getElementById('yr');

      if (yearElement) {
        yearElement.textContent =
          new Date().getFullYear();
      }


      /* ---------------------------
         Initial section detection
         --------------------------- */

      this.updateSection();
    },


    /* =====================================================
       CONTACT CONFIRMATION
       ===================================================== */

    openConfirmation() {
      if (!this.$refs.contactForm) return;

      if (!this.$refs.contactForm.reportValidity()) {
        return;
      }

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


    /* =====================================================
       SEND CONTACT INQUIRY
       ===================================================== */

    async sendInquiry(route) {
      if (!this.$refs.contactForm) return;

      this.submitting = true;
      this.submitError = '';

      this.upworkStatus =
        route === 'upwork'
          ? 'Upwork verified'
          : 'upwork-status_';

      try {
        const response = await fetch(
          this.$refs.contactForm.action,
          {
            method: 'POST',
            body: new FormData(
              this.$refs.contactForm
            ),
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(
            'Formspree request failed'
          );
        }

        this.$refs.contactForm.reset();
        this.upworkStatus = '';

        /* ---------------------------
           Upwork
           --------------------------- */

        if (route === 'upwork') {
          window.location.assign(
            'https://www.upwork.com/freelancers/~01362d3f829f520be8'
          );

          return;
        }

        /* ---------------------------
           Meeting / normal inquiry
           --------------------------- */

        this.submitted = true;

      } catch (error) {

        this.submitError =
          'Something went wrong while sending your request. Please try again.';

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
  };
}


/* =========================================================
   BLOG CAROUSEL
   ========================================================= */

function scrollBlog(direction) {
  const slider = window.blogSlider;

  if (!slider || slider.animating) {
    return;
  }

  /*
   * Pause autoplay briefly after manual interaction.
   */
  slider.pausedUntil =
    Date.now() + 4500;

  slider.move(direction);
}


/* =========================================================
   INITIALIZE BLOG SLIDER
   ========================================================= */

function initBlogSlider() {
  const carousel =
    document.getElementById('blogCarousel');

  if (!carousel || window.blogSlider) {
    return;
  }

  const originals =
    Array.from(
      carousel.querySelectorAll('article')
    );

  if (!originals.length) {
    return;
  }

  const total = originals.length;


  /* -------------------------------------------------------
     Clone cards for infinite scrolling
     ------------------------------------------------------- */

  const before =
    originals.map(card =>
      card.cloneNode(true)
    );

  const after =
    originals.map(card =>
      card.cloneNode(true)
    );


  before.forEach(card => {
    card.classList.remove('reveal');

    carousel.insertBefore(
      card,
      carousel.firstChild
    );
  });


  after.forEach(card => {
    card.classList.remove('reveal');

    carousel.appendChild(card);
  });


  /* -------------------------------------------------------
     Slider state
     ------------------------------------------------------- */

  const slider = {

    carousel,

    total,

    index: total,

    animating: false,

    paused: false,

    pausedUntil: 0,

    timer: null,

    animationDuration: 760,


    /* -----------------------------------------------------
       Calculate one card movement
       ----------------------------------------------------- */

    step() {
      const card =
        carousel.querySelector('article');

      if (!card) {
        return 0;
      }

      const styles =
        getComputedStyle(carousel);

      const gap =
        parseFloat(
          styles.columnGap ||
          styles.gap
        ) || 24;

      return (
        card.getBoundingClientRect().width +
        gap
      );
    },


    /* -----------------------------------------------------
       Move slider
       ----------------------------------------------------- */

    move(direction) {
      if (this.animating) {
        return;
      }

      const step =
        this.step();

      if (!step) {
        return;
      }

      const nextIndex =
        this.index + direction;

      this.index = nextIndex;

      this.animating = true;


      const reducedMotion =
        window.matchMedia &&
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;


      carousel.scrollTo({
        left:
          Math.round(
            nextIndex * step
          ),
        behavior:
          reducedMotion
            ? 'auto'
            : 'smooth'
      });


      window.setTimeout(
        () => {

          /* ---------------------------------------------
             Jump from right clones back to original cards
             --------------------------------------------- */

          if (
            this.index >=
            this.total * 2
          ) {
            this.index -= this.total;

            carousel.scrollTo({
              left:
                Math.round(
                  this.index *
                  this.step()
                ),
              behavior: 'auto'
            });
          }


          /* ---------------------------------------------
             Jump from left clones forward
             --------------------------------------------- */

          else if (
            this.index < this.total
          ) {
            this.index += this.total;

            carousel.scrollTo({
              left:
                Math.round(
                  this.index *
                  this.step()
                ),
              behavior: 'auto'
            });
          }


          this.animating = false;

        },
        this.animationDuration
      );
    },


    /* -----------------------------------------------------
       Autoplay
       ----------------------------------------------------- */

    schedule() {
      window.clearTimeout(
        this.timer
      );


      /*
       * Standard ~4.5 second autoplay timing.
       */
      this.timer =
        window.setTimeout(
          () => {

            const pageVisible =
              document.visibilityState ===
              'visible';

            const motionAllowed =
              !(
                window.matchMedia &&
                window.matchMedia(
                  '(prefers-reduced-motion: reduce)'
                ).matches
              );


            if (
              !this.paused &&
              pageVisible &&
              motionAllowed &&
              Date.now() >=
              this.pausedUntil
            ) {
              this.move(1);
            }


            this.schedule();

          },
          4500
        );
    }
  };


  window.blogSlider = slider;


  /* -------------------------------------------------------
     Set initial position
     ------------------------------------------------------- */

  carousel.scrollLeft =
    Math.round(
      slider.index *
      slider.step()
    );


  /* -------------------------------------------------------
     Mouse interaction
     ------------------------------------------------------- */

  carousel.addEventListener(
    'mouseenter',
    () => {
      slider.paused = true;
    }
  );


  carousel.addEventListener(
    'mouseleave',
    () => {
      slider.paused = false;

      slider.pausedUntil =
        Date.now() + 1200;
    }
  );


  /* -------------------------------------------------------
     Keyboard / focus interaction
     ------------------------------------------------------- */

  carousel.addEventListener(
    'focusin',
    () => {
      slider.paused = true;
    }
  );


  carousel.addEventListener(
    'focusout',
    () => {
      slider.paused = false;

      slider.pausedUntil =
        Date.now() + 1500;
    }
  );


  /* -------------------------------------------------------
     Touch interaction
     ------------------------------------------------------- */

  carousel.addEventListener(
    'touchstart',
    () => {

      slider.animating = false;
      slider.paused = true;

    },
    { passive: true }
  );


  carousel.addEventListener(
    'touchend',
    () => {

      window.setTimeout(
        () => {

          const step =
            slider.step();

          if (!step) {
            slider.paused = false;
            return;
          }


          slider.index =
            Math.round(
              carousel.scrollLeft /
              step
            );


          /* ---------------------------------------------
             Keep the slider inside the clone loop
             --------------------------------------------- */

          if (
            slider.index >=
            slider.total * 2
          ) {
            slider.index -=
              slider.total;

            carousel.scrollTo({
              left:
                Math.round(
                  slider.index *
                  slider.step()
                ),
              behavior: 'auto'
            });
          }


          else if (
            slider.index <
            slider.total
          ) {
            slider.index +=
              slider.total;

            carousel.scrollTo({
              left:
                Math.round(
                  slider.index *
                  slider.step()
                ),
              behavior: 'auto'
            });
          }


          slider.paused = false;

          slider.pausedUntil =
            Date.now() + 1800;

        },
        150
      );

    },
    { passive: true }
  );


  /* -------------------------------------------------------
     Resize handling
     ------------------------------------------------------- */

  let resizeTimer = null;

  window.addEventListener(
    'resize',
    () => {

      window.clearTimeout(
        resizeTimer
      );

      resizeTimer =
        window.setTimeout(
          () => {

            const step =
              slider.step();

            if (!step) return;

            carousel.scrollLeft =
              Math.round(
                slider.index *
                step
              );

          },
          120
        );
    },
    { passive: true }
  );


  /* -------------------------------------------------------
     Pause when browser tab isn't visible
     ------------------------------------------------------- */

  document.addEventListener(
    'visibilitychange',
    () => {

      if (
        document.visibilityState ===
        'hidden'
      ) {
        slider.paused = true;
      } else {
        slider.paused = false;

        slider.pausedUntil =
          Date.now() + 1500;
      }
    }
  );


  /* -------------------------------------------------------
     Start autoplay
     ------------------------------------------------------- */

  slider.schedule();
}


/* =========================================================
   START BLOG SLIDER
   ========================================================= */

if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    initBlogSlider
  );

} else {

  initBlogSlider();

}