function detectGraphicsCard() {
  let canvas = document.createElement("canvas");
  let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (gl) {
    let debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

    if (renderer.toLowerCase().includes("intel arc")) {
      return "dedicated";
    } else if (renderer.toLowerCase().includes("intel")) {
      return "integrated";
    } else if (renderer.toLowerCase().includes("nvidia")) {
      return "dedicated";
    } else if (renderer.toLowerCase().includes("amd") || renderer.toLowerCase().includes("radeon")) {
      if (renderer.toLowerCase().includes("rx") || renderer.toLowerCase().includes("pro")) {
        return "dedicated";
      } else if (renderer.toLowerCase().includes("vega") || renderer.toLowerCase().includes("graphics")) {
        return "integrated";
      } else {
        return "unknown";
      }
    } else {
      return "unknown";
    }
  } else {
    return "no_webgl";
  }
}

function handleSplineFallback() {
  const splineSection = document.getElementById("spline-section");
  const toggleViewButton = document.getElementById("toggle-view");

  const deviceMemory = navigator.deviceMemory || 4;
  const cpuCores = navigator.hardwareConcurrency || 4;
  const graphicsCardType = detectGraphicsCard();

  let initialView;
  if (
    window.innerWidth < 768 ||
    deviceMemory < 4 ||
    cpuCores < 4 ||
    graphicsCardType === "integrated" ||
    graphicsCardType === "unknown" ||
    graphicsCardType === "no_webgl"
  ) {
    initialView = "fallback";
    splineSection.innerHTML = `
      <div id="fallback-content" class="w-full h-screen flex items-center justify-center bg-gray-200">
        <video autoplay muted loop class="w-full h-full object-cover">
          <source src="./resources/video/Rusky-Web-Mobile.mp4" type="video/mp4">
          Tu navegador no soporta la reproducción de videos.
        </video>
      </div>`;
  } else {
    initialView = "spline";
    splineSection.innerHTML = `
      <spline-viewer id="spline-viewer" url="https://prod.spline.design/7W4P3fHeuiIc0No0/scene.splinecode"></spline-viewer>`;
  }

  toggleViewButton.textContent = initialView === "spline" ? "3D" : "2D";

  toggleViewButton.onclick = function () {
    if (initialView === "spline") {
      splineSection.innerHTML = `
        <div id="fallback-content" class="w-full h-screen flex items-center justify-center bg-gray-200">
          <video autoplay muted loop class="w-full h-full object-cover">
            <source src="./resources/video/Rusky-Web-Mobile.mp4" type="video/mp4">
            Tu navegador no soporta la reproducción de videos.
          </video>
        </div>`;
      toggleViewButton.textContent = "2D";
      initialView = "fallback";
    } else {
      splineSection.innerHTML = `
        <spline-viewer id="spline-viewer" url="https://prod.spline.design/7W4P3fHeuiIc0No0/scene.splinecode"></spline-viewer>`;
      toggleViewButton.textContent = "3D";
      initialView = "spline";
    }
  };
}

async function cargarProyectos() {
  try {
    const response = await fetch("./resources/json/proyectos.json");
    const proyectos = await response.json();
    const projectsContainer = document.getElementById("projects-container");
    const knowledge = await fetch("./resources/json/conocimientos.json");
    const conocimientos = await knowledge.json();

    proyectos.forEach((proyecto) => {
      const projectLink = document.createElement("a");
      projectLink.href = proyecto.link || "#";
      projectLink.classList.add(
        "block",
        "bg-white",
        "p-6",
        "rounded-lg",
        "shadow",
        "hover:shadow-xl",
        "hover:bg-blue-50",
        "transition-shadow",
        "duration-300"
      );

      let knowledgeIcons = "";
      proyecto.skills.forEach((skillname) => {
        const skill = conocimientos.knowledge.find((k) => k.name === skillname);
        if (skill) {
          knowledgeIcons += `<img src="${skill.icon}" alt="${skill.name}" class="w-6 h-6" title="${skill.name}"/>`;
        }
      });
      projectLink.innerHTML = `
        <div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          <img src="${proyecto.image}" alt="${proyecto.alt}" class="object-cover w-full h-full" />
        </div>
        <h3 class="text-2xl font-bold mt-6 text-gray-700">${proyecto.title}</h3>
        <p class="text-gray-500 mt-2">${proyecto.description}</p>
        <p class="text-gray-500 mt-2">${proyecto.date}</p>
        <div class="flex justify-center mt-6 space-x-4">${knowledgeIcons}</div>
      `;

      projectsContainer.appendChild(projectLink);
    });
  } catch (error) {
    console.error("Error al cargar los proyectos:", error);
  }
}

async function loadKnowledge() {
  try {
    const response = await fetch("./resources/json/conocimientos.json");
    const data = await response.json();
    const section = document.getElementById("my-knowledge");

    const introDiv = document.getElementById("knowledge-intro");

    const title = document.createElement("h2");
    title.className = "text-3xl font-extrabold text-gray-800 mb-4";
    title.textContent = data.title;
    introDiv.appendChild(title);

    const description = document.createElement("p");
    description.className = "text-lg text-gray-600 mb-8";
    description.textContent = data.description;
    introDiv.appendChild(description);

    const grid = document.getElementById("knowledge-grid");

    const renderItems = (category) => {
      grid.classList.remove("visible");

      setTimeout(() => {
        grid.innerHTML = "";
        const filteredItems = data.knowledge.filter((item) => category === "all" || item.category === category);
        filteredItems.forEach((item, index) => {
          const card = document.createElement("div");
          card.className =
            "bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow duration-300 flex flex-col items-center knowledge-card";

          const img = document.createElement("img");
          img.src = item.icon;
          img.alt = `${item.name} icon`;
          img.className = "mb-4";
          card.appendChild(img);

          const name = document.createElement("h3");
          name.className = "text-2xl font-bold text-gray-700 mb-4";
          name.textContent = item.name;
          card.appendChild(name);

          let itemcolor;
          switch (item.level) {
            case "Alto":
              itemcolor = "text-green-400";
              break;
            case "Medio-Alto":
              itemcolor = "text-lime-400";
              break;
            case "Medio":
              itemcolor = "text-orange-400";
              break;
            case "Bajo":
              itemcolor = "text-red-400";
              break;
          }

          const description = document.createElement("p");
          description.className = `text-gray-500`;
          description.textContent = `${item.description}`;
          card.appendChild(description);

          grid.appendChild(card);

          setTimeout(() => {
            card.classList.add("visible");
          }, index * 100);
        });

        requestAnimationFrame(() => {
          grid.classList.add("visible");
        });
      }, 300);
    };

    renderItems("all");

    document.querySelectorAll(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.getAttribute("data-category");
        renderItems(category);
      });
    });
  } catch (error) {
    console.error("Error al cargar el archivo JSON:", error);
  }
}

window.addEventListener("load", () => {
  handleSplineFallback();
  cargarProyectos();
  loadKnowledge();
});

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
