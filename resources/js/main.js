async function loadKnowledge() {
  const grid = document.getElementById("knowledge-grid");
  const buttons = document.querySelectorAll(".filter-button");
  const cards = Array.from(document.querySelectorAll("#knowledge-grid > div"));
  const allButton = document.querySelector('.filter-button[data-category="all"]');

  if (allButton) allButton.classList.add("active");

  const renderItems = (category) => {
    cards.forEach(card => {
      card.classList.remove("visible");
      card.style.display = "none";
    });

    const matches = cards.filter(card => category === "all" || card.dataset.category === category);

    matches.forEach(card => card.style.display = "");

    requestAnimationFrame(() => {
      matches.forEach((card, index) => {
        setTimeout(() => card.classList.add("visible"), index * 80);
      });
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      renderItems(button.dataset.category);
    });
  });

  grid.classList.add("visible");
  renderItems("all");
}



document.addEventListener("DOMContentLoaded", () =>{
  loadKnowledge();
})

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
