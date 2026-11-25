const testimonialWheel = document.querySelector(".testimonial-wheel");
const testimonialQuote = document.querySelector(".testimonial-quote");

testimonialWheel.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) testimonialQuote.textContent = button.dataset.quote;
});
