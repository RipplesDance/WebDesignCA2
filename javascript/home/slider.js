const track = document.querySelector(".slides");
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".slider-dots button");
let current = 0;
let startX = 0;
let startY = 0;

function showSlide(index) {
  slides[current].inert = true;
  dots[current].setAttribute("aria-pressed", "false");

  current = index;
  track.style.transform = "translateX(-" + current * 100 + "%)";
  slides[current].inert = false;
  dots[current].setAttribute("aria-pressed", "true");
}

dots.forEach(function (dot, index) {
  dot.addEventListener("click", function () {
    showSlide(index);
  });
});

track.addEventListener("touchstart", function (event) {
  startX = event.touches[0].clientX;
  startY = event.touches[0].clientY;
});

track.addEventListener("touchend", function (event) {
  const touch = event.changedTouches[0];
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;
  if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;

  const next = current + (dx < 0 ? 1 : -1);
  if (next >= 0 && next < slides.length) showSlide(next);
});
