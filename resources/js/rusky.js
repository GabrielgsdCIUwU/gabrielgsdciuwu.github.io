const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main-content");
const menuIcon = document.getElementById("menu-icon");
const easterbutton = document.getElementById("easter-button");
const easteregg = document.getElementById("easter-egg");
const ruskmodel = document.getElementById("rusk-model");
const ruskmodelbutton = document.getElementById("rusk-model-button");
const ruskcustom = document.getElementById("rusk-custom");
const ruskcustombutton = document.getElementById("rusk-custom-button");
const ruskdances = document.getElementById("rusk-dances");
const ruskdancesbutton = document.getElementById("rusk-dances-button");
const ruskprops = document.getElementById("rusk-props")
const ruskpropsbutton = document.getElementById("rusk-props-button");
const ruskinteracts = document.getElementById("rusk-interacts");
const ruskinteractsbutton = document.getElementById("rusk-interacts-button")


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



ruskmodelbutton.addEventListener("click", () => {
  ruskmodel.classList.remove("hidden");
  setTimeout(() => {
    click = true;
  }, 50);
});

ruskcustombutton.addEventListener("click", () => {
  ruskcustom.classList.remove("hidden");
  setTimeout(() => {
    click = true;
  }, 50);
});

ruskdancesbutton.addEventListener("click", () => {
  ruskdances.classList.remove("hidden");
  setTimeout(() => {
    click = true;
  }, 50);
});

ruskpropsbutton.addEventListener("click", () => {
  ruskprops.classList.remove("hidden");
  setTimeout(() => {
    click = true;
  }, 50);
});

ruskinteractsbutton.addEventListener("click", () => {
  ruskinteracts.classList.remove("hidden");
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
        return
      }
    }
  }
  if (!ruskmodel.classList.contains("hidden")) {
    if (click === true) {
      if (!ruskmodel.querySelector(".bg-white").contains(event.target)) {
        ruskmodel.classList.add("hidden");
        click = false;
        return
      }
    }
  }
  if (!ruskcustom.classList.contains("hidden")) {
    if (click === true) {
      if (!ruskcustom.querySelector(".bg-white").contains(event.target)) {
        ruskcustom.classList.add("hidden");
        click = false;
        return
      }
    }
  }
  if (!ruskdances.classList.contains("hidden")) {
    if (click === true) {
      if (!ruskdances.querySelector(".bg-white").contains(event.target)) {
        ruskdances.classList.add("hidden");
        click = false;
        return
      }
    }
  }
  if (!ruskprops.classList.contains("hidden")) {
    if (click === true) {
      if (!ruskprops.querySelector(".bg-white").contains(event.target)) {
        ruskprops.classList.add("hidden");
        click = false;
        return
      }
    }
  }
  if (!ruskinteracts.classList.contains("hidden")) {
    if (click === true) {
      if (!ruskinteracts.querySelector(".bg-white").contains(event.target)) {
        ruskinteracts.classList.add("hidden");
        click = false;
        return
      }
    }
  }
});


window.addEventListener("resize", adjustMainContentMargin);
adjustMainContentMargin();
