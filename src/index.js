// Social Link Transition

const slt = document.querySelector("#social-link-transition");

document.querySelectorAll(".social-button").forEach((socialButton) => {
  socialButton.addEventListener("click", (e) => {
    slt.style.left = e.pageX + "px";
    slt.style.top = e.pageY + "px";

    e.target.classList.forEach((className) => {
      if (className !== "social-button") {
        slt.classList.add(className, "show");
      }
    });
  });
});

// Reset the overlay when user returns to the page via the back button
const resetOverlay = () => slt.classList.remove(...slt.classList);
window.addEventListener("pageshow", resetOverlay);
document.addEventListener("visibilitychange", resetOverlay);
