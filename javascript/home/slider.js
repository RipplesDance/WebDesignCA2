const track = document.querySelector(".slides");
const dotContainer = document.querySelector(".slider-dots");
const dots = Array.from(dotContainer.querySelectorAll("button"));
let current = 0;

function showSlide(index) {
  dots[current].classList.remove("active");
  current = index;
  track.style.transform = `translateX(-${current * 100}%)`;
  dots[current].classList.add("active");
}

dotContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const index = dots.indexOf(button);
  if (index !== -1) showSlide(index);
});
