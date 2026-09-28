function scrollBlog(direction) {
  const slider = window.blogSlider;

  if (!slider || slider.animating) return;

  slider.pauseFor(3500);
  slider.move(direction);
}

function initBlogSlider() {
  const carousel = document.getElementById('blogCarousel');

  if (!carousel || window.blogSlider) return;

  const originals = Array.from(
    carousel.querySelectorAll(':scope > article')
  );

  if (!originals.length) return;

  const total = originals.length;

  // Create clones before and after the original cards.
  // This creates the illusion of a truly infinite carousel.
  const before = originals.map((card) => card.cloneNode(true));
  const after = originals.map((card) => card.cloneNode(true));

  // Insert previous clones in reverse order.
  before.reverse().forEach((card) => {
    card.classList.remove('reveal');
    card.setAttribute('aria-hidden', 'true');

    carousel.insertBefore(card, carousel.firstChild);
  });

  // Insert next clones.
  after.forEach((card) => {
    card.classList.remove('reveal');
    card.setAttribute('aria-hidden', 'true');

    carousel.appendChild(card);
  });

  const slider = {
    carousel,
    total,

    // Start on the first ORIGINAL card.
    index: total,

    animating: false,
    paused: false,

    pausedUntil: 0,

    timer: null,
    moveTimer: null,
    resizeTimer: null,

    // Time between automatic slides.
    interval: 4500,

    // Smooth scrolling duration.
    duration: 650,

    /**
     * Get all direct article cards.
     */
    cards() {
      return Array.from(
        this.carousel.querySelectorAll(':scope > article')
      );
    },

    /**
     * Calculate the exact scroll position for a card.
     *
     * This is more reliable than using a fixed card width
     * because the card width changes responsively.
     */
    targetFor(index) {
      const card = this.cards()[index];

      if (!card) return 0;

      const cardRect = card.getBoundingClientRect();
      const carouselRect = this.carousel.getBoundingClientRect();

      return Math.max(
        0,
        Math.round(
          cardRect.left -
            carouselRect.left +
            this.carousel.scrollLeft
        )
      );
    },

    /**
     * Find the card closest to the current scroll position.
     * Useful after the user manually drags/swipes the carousel.
     */
    nearestIndex() {
      const cards = this.cards();

      if (!cards.length) return 0;

      const currentScroll = this.carousel.scrollLeft;

      let nearest = 0;
      let distance = Infinity;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const carouselRect =
          this.carousel.getBoundingClientRect();

        const target = Math.max(
          0,
          cardRect.left -
            carouselRect.left +
            currentScroll
        );

        const delta = Math.abs(
          target - currentScroll
        );

        if (delta < distance) {
          distance = delta;
          nearest = index;
        }
      });

      return nearest;
    },

    /**
     * Immediately move to a specific card.
     *
     * Used when jumping between the cloned cards
     * and their original equivalents.
     */
    jumpTo(index) {
      this.index = index;

      this.carousel.scrollLeft =
        this.targetFor(index);
    },

    /**
     * Normalize the carousel position.
     *
     * Example:
     *
     * ORIGINAL 1 2 3 4 5
     *
     * If we move into the cloned cards after 5,
     * silently jump back to the equivalent original card.
     */
    normalize() {
      if (this.index >= total * 2) {
        this.jumpTo(this.index - total);
      } else if (this.index < total) {
        this.jumpTo(this.index + total);
      }
    },

    /**
     * Move one slide.
     *
     * direction:
     *   1  = next
     *  -1  = previous
     */
    move(direction) {
      if (this.animating) return;

      const nextIndex =
        this.index + direction;

      // Prevent moving outside our clone range.
      if (
        nextIndex < 0 ||
        nextIndex >= total * 3
      ) {
        return;
      }

      this.index = nextIndex;
      this.animating = true;

      this.carousel.scrollTo({
        left: this.targetFor(nextIndex),
        behavior: 'smooth'
      });

      window.clearTimeout(this.moveTimer);

      this.moveTimer = window.setTimeout(() => {
        this.normalize();

        this.animating = false;
      }, this.duration + 80);
    },

    /**
     * Temporarily delay autoplay.
     *
     * Used after clicking arrows or interacting
     * with the carousel.
     */
    pauseFor(ms) {
      this.pausedUntil =
        Date.now() + ms;
    },

    /**
     * Start the automatic slider timer.
     */
    schedule() {
      window.clearTimeout(this.timer);

      this.timer = window.setTimeout(() => {
        if (
          !this.paused &&
          Date.now() >= this.pausedUntil &&
          !this.animating
        ) {
          this.move(1);
        }

        this.schedule();
      }, this.interval);
    },

    /**
     * Synchronize the internal index after
     * manual mouse/touch scrolling.
     */
    syncAfterInteraction() {
      if (this.animating) return;

      const nearest =
        this.nearestIndex();

      if (nearest === this.index) return;

      this.index = nearest;

      if (
        this.index >= total * 2 ||
        this.index < total
      ) {
        this.normalize();
      }
    }
  };

  // Make the slider available globally so the
  // previous/next buttons can use it.
  window.blogSlider = slider;

  // Start at the first ORIGINAL card,
  // not the cloned cards.
  slider.jumpTo(total);

  /**
   * Pause when the mouse is over the carousel.
   */
  carousel.addEventListener(
    'mouseenter',
    () => {
      slider.paused = true;
    }
  );

  /**
   * Resume after the mouse leaves.
   */
  carousel.addEventListener(
    'mouseleave',
    () => {
      slider.paused = false;
      slider.pauseFor(1200);
    }
  );

  /**
   * Pause when keyboard focus enters the slider.
   */
  carousel.addEventListener(
    'focusin',
    () => {
      slider.paused = true;
    }
  );

  /**
   * Resume when keyboard focus leaves.
   */
  carousel.addEventListener(
    'focusout',
    () => {
      slider.paused = false;
      slider.pauseFor(1200);
    }
  );

  /**
   * User starts dragging/swiping.
   *
   * Stop the current animation so manual
   * interaction feels natural.
   */
  carousel.addEventListener(
    'pointerdown',
    () => {
      slider.animating = false;

      window.clearTimeout(
        slider.moveTimer
      );

      slider.paused = true;
    },
    {
      passive: true
    }
  );

  /**
   * User finishes dragging/swiping.
   */
  carousel.addEventListener(
    'pointerup',
    () => {
      window.setTimeout(() => {
        slider.syncAfterInteraction();

        slider.paused = false;

        // Give the user some time before autoplay resumes.
        slider.pauseFor(1800);
      }, 120);
    },
    {
      passive: true
    }
  );

  /**
   * Keep autoplay from fighting with
   * manual scrolling.
   */
  carousel.addEventListener(
    'scroll',
    () => {
      if (!slider.animating) return;

      slider.pauseFor(1200);
    },
    {
      passive: true
    }
  );

  /**
   * Recalculate the current position when
   * the screen changes size.
   *
   * This prevents misalignment after:
   * - resizing the browser
   * - rotating a phone
   * - changing responsive breakpoints
   */
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(
        slider.resizeTimer
      );

      slider.resizeTimer =
        window.setTimeout(() => {
          slider.jumpTo(slider.index);
        }, 100);
    }
  );

  // Start automatic scrolling.
  slider.schedule();
}


/**
 * Initialize the slider after the DOM is ready.
 */
if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initBlogSlider
  );
} else {
  initBlogSlider();
}
