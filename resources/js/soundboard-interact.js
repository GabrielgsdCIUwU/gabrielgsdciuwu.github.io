// Incluir la librería de Socket.IO
const socket = io(); // Conectar al servidor Socket.IO

socket.on("connect", () => {
  console.log("Conectado al servidor Socket.IO");
});

socket.on("disconnect", () => {
  console.log("Desconectado del servidor Socket.IO");
});

document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.querySelector(".tabs");
  const launchpad = document.getElementById("launchpad");
  const stopAllButton = document.getElementById("stop-all");
  const volumeControl = document.getElementById("volume");
  let activeSounds = [];

  let folders = {};
  let stopAllRequested = false; // Bandera para controlar la solicitud de stopAll

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
        document.querySelectorAll(".button").forEach((button) => {
          button.style.backgroundColor = "";
        });
        button.style.backgroundColor = "#ff4d4d";
        playSound(button.dataset.soundUrl, button);
      });

      launchpad.appendChild(button);
    });
  }

  function playSound(url, button) {
    const audio = new Audio(url);
    audio.volume = volumeControl.value;
    audio.play().catch((error) => console.error("Error playing sound:", error));

    // Emitir evento para reproducir el sonido
    socket.emit("playSound", { url: url, volume: volumeControl.value });

    activeSounds.push({ audio, button });

    audio.addEventListener("ended", () => {
      activeSounds = activeSounds.filter((sound) => sound.audio !== audio);
      button.style.backgroundColor = ""; // Restablecer el color original del botón
    });
  }

  // Manejar el evento de 'stopAll' de Socket.IO
  stopAllButton.addEventListener("click", () => {
    if (!stopAllRequested) {
      stopAllRequested = true; // Marcar que se ha solicitado detener todos los sonidos
      socket.emit("stopAll"); // Emitir el evento para detener todos los sonidos
    }
  });

  // Manejo del evento 'stopAll' recibido desde el servidor
  socket.on("stopAll", () => {
    activeSounds.forEach(({ audio, button }) => {
      audio.pause();
      button.style.backgroundColor = ""; // Restablecer el color original de todos los botones activos
    });
    activeSounds = [];
    stopAllRequested = false; // Restablecer la bandera para futuras solicitudes
  });

  volumeControl.addEventListener("input", () => {
    activeSounds.forEach(({ audio }) => (audio.volume = volumeControl.value));
  });
});
