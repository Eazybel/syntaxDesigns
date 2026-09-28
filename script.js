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
   MAIN ALPINE APPLICATION
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


    /* -------------------------------------------------------
       INITIALIZATION
    ------------------------------------------------------- */

    init() {

      /* Dark mode */
      this.dark =
        localStorage.getItem('theme') === 'dark' ||
        (
          !localStorage.getItem('theme') &&
          window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches
        );

      this.$watch('dark', value => {
        localStorage.setItem(
          'theme',
          value ? 'dark' : 'light'
        );
      });


      /* Scroll handling */
      window.addEventListener(
        'scroll',
        () => {
          this.sc = window.scrollY > 20;

          this.updateSection();
        },
        {
          passive: true
        }
      );


      /* Reveal animations */
      const io = new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (entry.isIntersecting) {

              entry.target.classList.add('in');

              io.unobserve(entry.target);
            }

          });

        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px'
        }
      );


      document
        .querySelectorAll('.reveal')
        .forEach(element => {
          io.observe(element);
        });


      /* Current year */
      const yearElement =
        document.getElementById('yr');

      if (yearElement) {
        yearElement.textContent =
          new Date().getFullYear();
      }
    },


    /* -------------------------------------------------------
       CONTACT CONFIRMATION
    ------------------------------------------------------- */

    openConfirmation() {

      if (
        !this.$refs.contactForm.reportValidity()
      ) {
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

      if (this.submitting) {
        return;
      }

      this.confirmationOpen = false;
      this.submitted = false;

      document.body.classList.remove(
        'modal-open'
      );
    },


    /* -------------------------------------------------------
       CONTACT FORM SUBMISSION
    ------------------------------------------------------- */

    async sendInquiry(route) {

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


        if (route === 'upwork') {

          window.location.assign(
            'https://www.upwork.com/freelancers/~01362d3f829f520be8'
          );

          return;
        }


        this.submitted = true;

      } catch (error) {

        this.submitError =
          'Something went wrong while sending your request. Please try again.';

      } finally {

        this.submitting = false;
      }
    },


    /* -------------------------------------------------------
       ACTIVE NAVIGATION SECTION
    ------------------------------------------------------- */

    updateSection() {

      const atBottom =
        (
          window.innerHeight +
          window.scrollY
        ) >=
        document.body.scrollHeight - 60;


      if (atBottom) {

        this.s = 'contact';

        return;
      }


      const ids = [
        'contact',
        'blog',
        'reviews',
        'about',
        'work',
        'services',
        'hero'
      ];


      for (const id of ids) {

        const element =
          document.getElementById(id);


        if (
          element &&
          window.scrollY >=
            element.offsetTop - 130
        ) {

          this.s = id;

          return;
        }
      }
    }
  };
}


/* =========================================================
   BLOG SLIDER
   ========================================================= */

/*
   Move the blog slider manually.

   direction:
   -1 = previous
    1 = next
*/

function scrollBlog(direction) {

  const slider =
    window.blogSlider;


  if (
    !slider ||
    slider.animating
  ) {
    return;
  }


  /*
     Give the user some time before
     automatic scrolling starts again.
  */
  slider.pauseFor(3500);


  slider.move(direction);
}


/* =========================================================
   INITIALIZE BLOG SLIDER
   ========================================================= */

function initBlogSlider() {

  const carousel =
    document.getElementById(
      'blogCarousel'
    );


  /*
     If the carousel doesn't exist,
     simply stop here.
  */
  if (!carousel) {
    return;
  }


  /*
     Prevent duplicate initialization.
  */
  if (window.blogSlider) {
    return;
  }


  /*
     Get only the original articles.
  */
  const originals =
    Array.from(
      carousel.querySelectorAll(
        ':scope > article'
      )
    );


  if (!originals.length) {
    return;
  }


  const total =
    originals.length;


  /* -------------------------------------------------------
     CREATE CLONES
     ------------------------------------------------------- */

  /*
     Clone cards before the originals.
     These are used when moving backwards.
  */
  const before =
    originals.map(card =>
      card.cloneNode(true)
    );


  /*
     Clone cards after the originals.
     These are used when moving forwards.
  */
  const after =
    originals.map(card =>
      card.cloneNode(true)
    );


  /*
     Insert the previous clones
     in reverse order.
  */
  before
    .reverse()
    .forEach(card => {

      /*
         Cloned cards should not participate
         in the reveal animation.
      */
      card.classList.remove(
        'reveal'
      );


      card.setAttribute(
        'aria-hidden',
        'true'
      );


      carousel.insertBefore(
        card,
        carousel.firstChild
      );
    });


  /*
     Insert the next clones.
  */
  after.forEach(card => {

    card.classList.remove(
      'reveal'
    );


    card.setAttribute(
      'aria-hidden',
      'true'
    );


    carousel.appendChild(card);
  });


  /* -------------------------------------------------------
     SLIDER OBJECT
     ------------------------------------------------------- */

  const slider = {

    carousel,

    total,

    /*
       The first original card starts
       after all the previous clones.
    */
    index: total,

    animating: false,

    paused: false,

    pausedUntil: 0,

    timer: null,

    moveTimer: null,

    resizeTimer: null,


    /*
       Time between automatic slides.
    */
    interval: 4500,


    /*
       Approximate smooth animation duration.
    */
    duration: 650,


    /* -----------------------------------------------------
       GET CARDS
    ----------------------------------------------------- */

    cards() {

      return Array.from(
        this.carousel.querySelectorAll(
          ':scope > article'
        )
      );
    },


    /* -----------------------------------------------------
       FIND EXACT CARD POSITION
    ----------------------------------------------------- */

    targetFor(index) {

      const cards =
        this.cards();


      const card =
        cards[index];


      if (!card) {
        return 0;
      }


      const cardRect =
        card.getBoundingClientRect();


      const carouselRect =
        this.carousel.getBoundingClientRect();


      /*
         Calculate the card's exact position
         relative to the scrolling container.

         This is much safer than assuming:
         card width + fixed gap
      */
      return Math.max(
        0,

        Math.round(
          cardRect.left -
          carouselRect.left +
          this.carousel.scrollLeft
        )
      );
    },


    /* -----------------------------------------------------
       FIND CURRENT CARD
    ----------------------------------------------------- */

    nearestIndex() {

      const cards =
        this.cards();


      if (!cards.length) {
        return 0;
      }


      const currentScroll =
        this.carousel.scrollLeft;


      let nearest = 0;

      let distance =
        Infinity;


      cards.forEach(
        (card, index) => {

          const cardRect =
            card.getBoundingClientRect();


          const carouselRect =
            this.carousel.getBoundingClientRect();


          const target =
            Math.max(
              0,

              cardRect.left -
              carouselRect.left +
              currentScroll
            );


          const delta =
            Math.abs(
              target -
              currentScroll
            );


          if (delta < distance) {

            distance = delta;

            nearest = index;
          }
        }
      );


      return nearest;
    },


    /* -----------------------------------------------------
       INSTANT POSITION
    ----------------------------------------------------- */

    jumpTo(index) {

      this.index = index;


      this.carousel.scrollLeft =
        this.targetFor(index);
    },


    /* -----------------------------------------------------
       INFINITE LOOP NORMALIZATION
    ----------------------------------------------------- */

    normalize() {

      /*
         If we've moved into the second
         set of clones, jump back to
         the corresponding original card.
      */
      if (
        this.index >= total * 2
      ) {

        this.jumpTo(
          this.index - total
        );

        return;
      }


      /*
         If we've moved backwards into
         the first clone set, jump forward
         to the corresponding original.
      */
      if (
        this.index < total
      ) {

        this.jumpTo(
          this.index + total
        );
      }
    },


    /* -----------------------------------------------------
       MOVE ONE CARD
    ----------------------------------------------------- */

    move(direction) {

      if (this.animating) {
        return;
      }


      const nextIndex =
        this.index + direction;


      /*
         We have three sets:
         
         clones + originals + clones

         Never move outside those bounds.
      */
      if (
        nextIndex < 0 ||
        nextIndex >= total * 3
      ) {
        return;
      }


      this.index =
        nextIndex;


      this.animating =
        true;


      /*
         Calculate the position dynamically
         instead of using a fixed card width.
      */
      const target =
        this.targetFor(
          nextIndex
        );


      this.carousel.scrollTo({
        left: target,
        behavior: 'smooth'
      });


      window.clearTimeout(
        this.moveTimer
      );


      this.moveTimer =
        window.setTimeout(
          () => {

            this.normalize();

            this.animating =
              false;

          },

          this.duration + 80
        );
    },


    /* -----------------------------------------------------
       PAUSE AUTOPLAY
    ----------------------------------------------------- */

    pauseFor(ms) {

      this.pausedUntil =
        Date.now() + ms;
    },


    /* -----------------------------------------------------
       AUTOPLAY
    ----------------------------------------------------- */

    schedule() {

      window.clearTimeout(
        this.timer
      );


      this.timer =
        window.setTimeout(
          () => {

            if (
              !this.paused &&
              Date.now() >=
                this.pausedUntil &&
              !this.animating
            ) {

              this.move(1);
            }


            this.schedule();

          },

          this.interval
        );
    },


    /* -----------------------------------------------------
       SYNCHRONIZE AFTER MANUAL SCROLL
    ----------------------------------------------------- */

    syncAfterInteraction() {

      if (this.animating) {
        return;
      }


      const nearest =
        this.nearestIndex();


      if (
        nearest === this.index
      ) {
        return;
      }


      this.index =
        nearest;


      /*
         If the user manually dragged
         into a clone area, silently move
         to the matching original.
      */
      if (
        this.index >= total * 2 ||
        this.index < total
      ) {

        this.normalize();
      }
    }
  };


  /* -------------------------------------------------------
     EXPOSE SLIDER
     ------------------------------------------------------- */

  window.blogSlider =
    slider;


  /*
     Start at the first ORIGINAL card,
     not at a clone.
  */
  slider.jumpTo(total);


  /* -------------------------------------------------------
     MOUSE HOVER
     ------------------------------------------------------- */

  carousel.addEventListener(
    'mouseenter',
    () => {

      slider.paused =
        true;
    }
  );


  carousel.addEventListener(
    'mouseleave',
    () => {

      slider.paused =
        false;


      slider.pauseFor(
        1200
      );
    }
  );


  /* -------------------------------------------------------
     KEYBOARD FOCUS
     ------------------------------------------------------- */

  carousel.addEventListener(
    'focusin',
    () => {

      slider.paused =
        true;
    }
  );


  carousel.addEventListener(
    'focusout',
    () => {

      slider.paused =
        false;


      slider.pauseFor(
        1200
      );
    }
  );


  /* -------------------------------------------------------
     TOUCH / POINTER START
     ------------------------------------------------------- */

  carousel.addEventListener(
    'pointerdown',
    () => {

      slider.animating =
        false;


      window.clearTimeout(
        slider.moveTimer
      );


      slider.paused =
        true;
    },
    {
      passive: true
    }
  );


  /* -------------------------------------------------------
     TOUCH / POINTER END
     ------------------------------------------------------- */

  carousel.addEventListener(
    'pointerup',
    () => {

      window.setTimeout(
        () => {

          slider.syncAfterInteraction();


          slider.paused =
            false;


          slider.pauseFor(
            1800
          );

        },

        120
      );
    },
    {
      passive: true
    }
  );


  /* -------------------------------------------------------
     SCROLL
     ------------------------------------------------------- */

  carousel.addEventListener(
    'scroll',
    () => {

      if (!slider.animating) {
        return;
      }


      slider.pauseFor(
        1200
      );
    },
    {
      passive: true
    }
  );


  /* -------------------------------------------------------
     RESPONSIVE RESIZE
     ------------------------------------------------------- */

  window.addEventListener(
    'resize',
    () => {

      window.clearTimeout(
        slider.resizeTimer
      );


      slider.resizeTimer =
        window.setTimeout(
          () => {

            /*
               Recalculate the position
               after the responsive card
               width changes.
            */
            slider.jumpTo(
              slider.index
            );

          },

          100
        );
    }
  );


  /* -------------------------------------------------------
     START AUTOPLAY
     ------------------------------------------------------- */

  slider.schedule();
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