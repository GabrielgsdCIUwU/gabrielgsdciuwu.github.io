document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.querySelector(".tabs");
  const launchpad = document.getElementById("launchpad");
  const stopAllButton = document.getElementById("stop-all");
  const volumeControl = document.getElementById("volume");
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

      // Crear las pestañas
      for (const folderName in folders) {
        const tab = document.createElement("button");
        tab.classList.add("tab");
        tab.innerText = folderName;
        tab.dataset.folderName = folderName;

        tab.addEventListener("click", () => {
          // Cambiar la pestaña activa
          document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
          tab.classList.add("active");

          // Mostrar los botones correspondientes
          showButtons(folderName);
        });

        tabsContainer.appendChild(tab);
      }

      // Activar la primera pestaña por defecto
      const firstTab = document.querySelector(".tab");
      if (firstTab) {
        firstTab.click();
      }
    })
    .catch((error) => console.error("Error cargando el JSON:", error));

  function showButtons(folderName) {
    launchpad.innerHTML = ""; // Limpiar los botones anteriores

    const folder = folders[folderName];
    folder.forEach((item) => {
      const button = document.createElement("button");
      button.classList.add("button");
      button.dataset.soundUrl = item.rawUrl;
      button.innerText = item.name.split(".")[0];

      button.addEventListener("click", () => {
        button.style.backgroundColor = "#ff4d4d";
        playSound(button.dataset.soundUrl, button);
      });

      launchpad.appendChild(button);
    });
  }

  function playSound(url, button) {
    const audio = new Audio(url);
    audio.volume = volumeControl.value;
    audio.play();
    activeSounds.push({ audio, button });

    audio.addEventListener("ended", () => {
      activeSounds = activeSounds.filter((sound) => sound.audio !== audio);
      button.style.backgroundColor = ""; // Restablecer el color original del botón
    });
  }

  stopAllButton.addEventListener("click", () => {
    activeSounds.forEach(({ audio, button }) => {
      audio.pause();
      button.style.backgroundColor = ""; // Restablecer el color original de todos los botones activos
    });
    activeSounds = [];
  });

  volumeControl.addEventListener("input", () => {
    activeSounds.forEach(({ audio }) => (audio.volume = volumeControl.value));
  });
});
