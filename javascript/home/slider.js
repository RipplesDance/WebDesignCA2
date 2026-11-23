const slider = document.querySelector(".hero-slider");

if (slider) {
  const stage = slider.querySelector(".hero-slides");
  const slides = Array.from(slider.querySelectorAll(".hero-slide"));
  const pager = slider.querySelector(".hero-pager");
  const dots = Array.from(pager.querySelectorAll(".hero-dot"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = -1;
  let transition = null;
  let touchStart = null;

  function finishTransition() {
    if (!transition) return;

    const { outgoing, animations } = transition;
    transition = null;
    outgoing.classList.remove("is-exiting");
    animations.forEach((animation) => animation.cancel());
  }

  function slideHorizontally(outgoing, incoming, direction) {
    outgoing.classList.add("is-exiting");
    const offset = direction * 100;
    const timing = { duration: 420, easing: "ease-in-out", fill: "both" };
    const enter = incoming.animate(
      [{ transform: `translateX(${offset}%)` }, { transform: "translateX(0)" }],
      timing,
    );
    const exit = outgoing.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${-offset}%)` }],
      timing,
    );

    const currentTransition = { outgoing, animations: [enter, exit] };
    transition = currentTransition;
    enter.onfinish = () => {
      if (transition === currentTransition) finishTransition();
    };
  }

  function selectSlide(index, direction = Math.sign(index - activeIndex)) {
    if (index === activeIndex) return;

    const outgoing = slides[activeIndex];
    const incoming = slides[index];
    finishTransition();
    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === index;
      slide.classList.toggle("is-active", selected);
      slide.inert = !selected;
      dots[slideIndex].setAttribute("aria-pressed", String(selected));
    });
    activeIndex = index;

    if (outgoing && !reducedMotion.matches && typeof incoming.animate === "function") {
      slideHorizontally(outgoing, incoming, direction);
    }
  }

  function adjacentIndex(index, direction) {
    return (index + direction + slides.length) % slides.length;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => selectSlide(index));
  });

  pager.addEventListener("keydown", (event) => {
    const index = dots.indexOf(event.target);
    if (index === -1) return;

    let nextIndex;
    let direction;
    switch (event.key) {
      case "ArrowLeft":
        direction = -1;
        nextIndex = adjacentIndex(index, direction);
        break;
      case "ArrowRight":
        direction = 1;
        nextIndex = adjacentIndex(index, direction);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = dots.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectSlide(nextIndex, direction);
    dots[nextIndex].focus();
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !event.isPrimary || event.target.closest("a, button")) return;

    touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  stage.addEventListener("pointerup", (event) => {
    if (touchStart?.id !== event.pointerId) return;

    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;

    const direction = dx < 0 ? 1 : -1;
    selectSlide(adjacentIndex(activeIndex, direction), direction);
  });

  stage.addEventListener("pointercancel", (event) => {
    if (touchStart?.id === event.pointerId) touchStart = null;
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) finishTransition();
  });

  // Stack slides in one grid cell so the carousel keeps its size during a slide.
  selectSlide(0);
  slides.forEach((slide) => {
    slide.hidden = false;
  });
  pager.hidden = false;
}
