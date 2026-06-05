document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.querySelector(".tabs");
  const launchpad = document.getElementById("launchpad");
  const stopAllButton = document.getElementById("stop-all");
  const volumeControl = document.getElementById("volume");
  const searchInput = document.getElementById("search-input");
  let activeSounds = [];

  let folders = {};

  // Cargar el JSON desde la URL de GitHub
  fetch("https://raw.githubusercontent.com/GabrielgsdCIUwU/soundboard/main/audio_files.json")
    .then((response) => response.json())
    .then((data) => {
      // Organizar los sonidos por carpetas
      data.forEach((item) => {
        const folderName = item.path.split("/")[0];
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(item);
      });

      // Crear pestaña "Todas"
      const allText = tabsContainer.dataset.allText || "All";
      const allTab = document.createElement("button");
      allTab.classList.add("tab");
      allTab.innerText = allText;
      allTab.dataset.folderName = "all";
      allTab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        allTab.classList.add("active");
        renderButtons();
      });
      tabsContainer.appendChild(allTab);

      // Crear las pestañas de carpetas
      for (const folderName in folders) {
        const tab = document.createElement("button");
        tab.classList.add("tab");
        tab.innerText = folderName;
        tab.dataset.folderName = folderName;

        tab.addEventListener("click", () => {
          document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          renderButtons();
        });

        tabsContainer.appendChild(tab);
      }

      // Activar la pestaña Todas por defecto
      allTab.click();

      if (searchInput) {
        searchInput.addEventListener("input", () => {
          renderButtons();
        });
      }
    })
    .catch((error) => console.error("Error cargando el JSON:", error));

  function renderButtons() {
    launchpad.innerHTML = ""; // Limpiar los botones anteriores

    let itemsToRender = [];
    const activeTab = document.querySelector(".tab.active");
    const folderName = activeTab ? activeTab.dataset.folderName : "all";

    if (folderName === "all") {
      for (const folder in folders) {
        itemsToRender = itemsToRender.concat(folders[folder]);
      }
    } else if (folders[folderName]) {
      itemsToRender = folders[folderName];
    }

    const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (searchText) {
      itemsToRender = itemsToRender.filter(item => item.name.toLowerCase().includes(searchText));
    }

    itemsToRender.forEach((item) => {
      const button = document.createElement("button");
      button.classList.add("button");
      button.dataset.soundUrl = item.rawUrl;
      button.innerText = item.name.split(".")[0];

      if (activeSounds.some(s => s.url === item.rawUrl)) {
        button.style.backgroundColor = "#ff4d4d";
      }

      button.addEventListener("click", () => {
        button.style.backgroundColor = "#ff4d4d";
        playSound(button.dataset.soundUrl);
      });

      launchpad.appendChild(button);
    });
  }

  function playSound(url) {
    const audio = new Audio(url);
    audio.volume = volumeControl.value;
    audio.play();
    activeSounds.push({ audio, url });

    audio.addEventListener("ended", () => {
      activeSounds = activeSounds.filter((sound) => sound.audio !== audio);
      const btn = document.querySelector(`button[data-sound-url="${url}"]`);
      if (btn) btn.style.backgroundColor = ""; // Restablecer el color original del botón
    });
  }

  stopAllButton.addEventListener("click", () => {
    activeSounds.forEach(({ audio, url }) => {
      audio.pause();
      const btn = document.querySelector(`button[data-sound-url="${url}"]`);
      if (btn) btn.style.backgroundColor = ""; // Restablecer el color original de todos los botones activos
    });
    activeSounds = [];
  });

  volumeControl.addEventListener("input", () => {
    activeSounds.forEach(({ audio }) => (audio.volume = volumeControl.value));
  });
});
