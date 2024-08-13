const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main-content");
const menuIcon = document.getElementById("menu-icon");
const easterbutton = document.getElementById("easter-button");
const easteregg = document.getElementById("easter-egg");
var click = false;
function adjustMainContentMargin() {
  if (sidebar.classList.contains("-translate-x-full")) {
    mainContent.style.marginLeft = "0";
  } else {
    const sidebarWidth = sidebar.offsetWidth;
    mainContent.style.marginLeft = `${sidebarWidth}px`;
  }
}

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  adjustMainContentMargin();
  menuIcon.classList.toggle("fa-bars");
  menuIcon.classList.toggle("fa-times");
});

easterbutton.addEventListener("click", () => {
  easteregg.classList.remove("hidden");
  setTimeout(() => {
    click = true;
  }, 50);
});

document.addEventListener("click", (event) => {
  if (!easteregg.classList.contains("hidden")) {
    if (click === true) {
      if (!easteregg.querySelector(".bg-white").contains(event.target)) {
        easteregg.classList.add("hidden");
        click = false;
      }
    }
  }
});

window.addEventListener("resize", adjustMainContentMargin);
adjustMainContentMargin();
