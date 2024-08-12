const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main-content");
const menuIcon = document.getElementById("menu-icon");

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

window.addEventListener("resize", adjustMainContentMargin);
adjustMainContentMargin();
