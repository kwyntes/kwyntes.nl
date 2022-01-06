// Social Link Transition

const slt = document.querySelector("#social-link-transition");

document.querySelectorAll(".social-button").forEach((socialButton) => {
  socialButton.addEventListener("click", (e) => {
    slt.style.left = e.pageX + "px";
    slt.style.top = e.pageY + "px";
    // classList[1] is the brand class
    slt.classList.add(e.target.classList[1], "show");
  });
});

// Remove the overlay when user returns to the page via the back button
window.addEventListener("pageshow", () => {
  slt.classList.remove("show");
});
