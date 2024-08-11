function detectGraphicsCard() {
  let canvas = document.createElement("canvas");
  let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (gl) {
    let debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

    console.log("Renderer:", renderer);
    console.log("Vendor:", vendor);

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

  const deviceMemory = navigator.deviceMemory || 4;
  const cpuCores = navigator.hardwareConcurrency || 4;
  const graphicsCardType = detectGraphicsCard();

  if (
    window.innerWidth < 768 ||
    deviceMemory < 4 ||
    cpuCores < 4 ||
    graphicsCardType === "integrated" ||
    graphicsCardType === "unknown" ||
    graphicsCardType === "no_webgl"
  ) {
    splineSection.innerHTML = `
        <div class="w-full h-screen flex items-center justify-center bg-gray-200">
            <video autoplay muted loop class="w-full h-full object-cover">
                <source src="./resources/video/Rusky-Web-Mobile.mp4" type="video/mp4">
                Tu navegador no soporta la reproducción de videos.
            </video>
        </div>
        `;
  } else {
    splineSection.innerHTML = `
        <spline-viewer url="https://prod.spline.design/7W4P3fHeuiIc0No0/scene.splinecode"></spline-viewer>`;
  }
}

window.addEventListener("resize", handleSplineFallback);
window.addEventListener("DOMContentLoaded", handleSplineFallback);

async function cargarProyectos() {
  try {
    const response = await fetch("./resources/json/proyectos.json");
    const proyectos = await response.json();
    const projectsContainer = document.getElementById("projects-container");

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
        "transition-shadow",
        "duration-300"
      );

      projectLink.innerHTML = `
        <div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          <img src="${proyecto.image}" alt="${proyecto.alt}" class="object-cover w-full h-full" />
        </div>
        <h3 class="text-2xl font-bold mt-6 text-gray-700">${proyecto.title}</h3>
        <p class="text-gray-500 mt-2">${proyecto.description}</p>
        <p class="text-gray-500 mt-2">${proyecto.date}</p>
      `;

      projectsContainer.appendChild(projectLink);
    });
  } catch (error) {
    console.error("Error al cargar los proyectos:", error);
  }
}

window.addEventListener("DOMContentLoaded", cargarProyectos);

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
