document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.querySelector(".tabs");
  const launchpad = document.getElementById("launchpad");
  const stopAllButton = document.getElementById("stop-all");
  const volumeControl = document.getElementById("volume");
  const searchInput = document.getElementById("search-input");
  
  const uploadModal = document.getElementById("upload-modal");
  const openUploadModalBtn = document.getElementById("open-upload-modal");
  const closeUploadModalBtn = document.getElementById("close-upload-modal");
  const uploadForm = document.getElementById("upload-form");
  const uploadStatus = document.getElementById("upload-status");
  const submitUploadBtn = document.getElementById("submit-upload");
  const prLink = document.getElementById("pr-link");

  const socket = typeof io !== 'undefined' ? io() : null;
  let currentMode = "local";
  const modeSelect = document.getElementById("mode-select");
  const remoteVolumeContainer = document.getElementById("remote-volume-container");
  const remoteVolumeControl = document.getElementById("remote-volume");
  const receiverOverlay = document.getElementById("receiver-overlay");

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

      // Rellenar las opciones del select para subida de audios
      const folderSelect = document.getElementById("folder-select");
      if (folderSelect) {
        for (const folderName in folders) {
          const option = document.createElement("option");
          option.value = folderName;
          option.textContent = folderName;
          folderSelect.appendChild(option);
        }
        // Añadir la opción de "nueva carpeta"
        const newOption = document.createElement("option");
        newOption.value = "new_folder";
        newOption.textContent = folderSelect.dataset.new;
        folderSelect.appendChild(newOption);
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

  function formatTime(seconds) {
    if (isNaN(seconds)) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

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
      button.style.display = "flex";
      button.style.flexDirection = "column";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      
      const titleSpan = document.createElement("div");
      titleSpan.innerText = item.name.split(".")[0];
      titleSpan.style.pointerEvents = "none";
      
      const timeSpan = document.createElement("div");
      timeSpan.classList.add("time-label");
      timeSpan.innerText = "--:--";
      timeSpan.style.fontSize = "12px";
      timeSpan.style.opacity = "0.7";
      timeSpan.style.marginTop = "5px";
      timeSpan.style.pointerEvents = "none";
      
      button.appendChild(titleSpan);
      button.appendChild(timeSpan);

      const tempAudio = new Audio(item.rawUrl);
      tempAudio.preload = "metadata";
      tempAudio.addEventListener("loadedmetadata", () => {
        timeSpan.dataset.total = tempAudio.duration;
        timeSpan.innerText = formatTime(tempAudio.duration);
      });

      if (activeSounds.some(s => s.url === item.rawUrl)) {
        button.style.backgroundColor = "#ff4d4d";
      }

      button.addEventListener("click", () => {
        button.style.backgroundColor = "#ff4d4d";
        playSound(button.dataset.soundUrl);
        if (socket && currentMode === "sender") {
          socket.emit("playSound", { url: button.dataset.soundUrl });
        }
      });

      launchpad.appendChild(button);
    });
  }

  function playSound(url) {
    const audio = new Audio(url);
    audio.volume = volumeControl.value;
    audio.play();
    activeSounds.push({ audio, url });

    audio.addEventListener("timeupdate", () => {
      const btn = document.querySelector(`button[data-sound-url="${url}"]`);
      if (btn) {
        const progress = (audio.currentTime / audio.duration) * 100;
        btn.style.background = `linear-gradient(to right, #ff4d4d ${progress}%, #444 ${progress}%)`;
        const timeSpan = btn.querySelector('.time-label');
        if (timeSpan) {
           timeSpan.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
      }
    });

    audio.addEventListener("ended", () => {
      activeSounds = activeSounds.filter((sound) => sound.audio !== audio);
      const btn = document.querySelector(`button[data-sound-url="${url}"]`);
      if (btn) {
        btn.style.background = ""; // Restablecer el color original del botón
        const timeSpan = btn.querySelector('.time-label');
        if (timeSpan && timeSpan.dataset.total) {
           timeSpan.innerText = formatTime(parseFloat(timeSpan.dataset.total));
        } else if (timeSpan) {
           timeSpan.innerText = "--:--";
        }
      }
    });
  }

  stopAllButton.addEventListener("click", (e) => {
    if (socket && currentMode === "sender" && e.isTrusted) {
      socket.emit("stopAll");
    }
    activeSounds.forEach(({ audio, url }) => {
      audio.pause();
      const btn = document.querySelector(`button[data-sound-url="${url}"]`);
      if (btn) {
        btn.style.background = ""; // Restablecer el color original de todos los botones activos
        const timeSpan = btn.querySelector('.time-label');
        if (timeSpan && timeSpan.dataset.total) {
           timeSpan.innerText = formatTime(parseFloat(timeSpan.dataset.total));
        } else if (timeSpan) {
           timeSpan.innerText = "--:--";
        }
      }
    });
    activeSounds = [];
  });

  volumeControl.addEventListener("input", () => {
    activeSounds.forEach(({ audio }) => (audio.volume = volumeControl.value));
  });

  if (openUploadModalBtn) {
    openUploadModalBtn.addEventListener("click", () => {
      uploadModal.style.display = "flex";
    });
  }

  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener("click", () => {
      uploadModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === uploadModal) {
      uploadModal.style.display = "none";
    }
  });

  if (modeSelect) {
    modeSelect.addEventListener("change", (e) => {
      currentMode = e.target.value;
      
      if (currentMode === "sender") {
        remoteVolumeContainer.classList.remove("hidden");
      } else {
        remoteVolumeContainer.classList.add("hidden");
      }

      if (currentMode === "receiver") {
        receiverOverlay.classList.remove("hidden");
      } else {
        receiverOverlay.classList.add("hidden");
      }
    });
  }

  if (receiverOverlay) {
    receiverOverlay.addEventListener("click", () => {
      receiverOverlay.classList.add("hidden");
    });
  }

  if (remoteVolumeControl && socket) {
    remoteVolumeControl.addEventListener("input", (e) => {
      if (currentMode === "sender") {
        socket.emit("changeVolume", { volume: parseFloat(e.target.value) });
      }
    });
  }

  if (socket) {
    socket.on("playSound", (data) => {
      if (currentMode === "receiver") {
        playSound(data.url);
      }
    });

    socket.on("stopAll", () => {
      if (currentMode === "receiver") {
        stopAllButton.click();
      }
    });

    socket.on("changeVolume", (data) => {
      if (currentMode === "receiver") {
        volumeControl.value = data.volume;
        volumeControl.dispatchEvent(new Event("input"));
      }
    });
  }

  const folderSelect = document.getElementById("folder-select");
  const newFolderInput = document.getElementById("new-folder-input");
  const finalFolderName = document.getElementById("final-folder-name");
  
  if (folderSelect && newFolderInput && finalFolderName) {
    folderSelect.addEventListener("change", () => {
      if (folderSelect.value === "new_folder") {
        newFolderInput.classList.remove("hidden");
        newFolderInput.required = true;
        finalFolderName.value = newFolderInput.value;
      } else {
        newFolderInput.classList.add("hidden");
        newFolderInput.required = false;
        finalFolderName.value = folderSelect.value;
      }
    });

    newFolderInput.addEventListener("input", () => {
      finalFolderName.value = newFolderInput.value;
    });
  }

  function formatTimeLeft(secondsLeft) {
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 || hours > 0 ? minutes + 'm ' : ''}${seconds}s`;
  }

  function handleRateLimit(retryAfter, errorMsg) {
    let secondsLeft = parseInt(retryAfter, 10);
    if (isNaN(secondsLeft) || secondsLeft <= 0) return;

    if (window.uploadRateLimitTimer) clearTimeout(window.uploadRateLimitTimer);

    const updateCounter = () => {
      if (secondsLeft <= 0) {
        uploadStatus.innerText = uploadForm.dataset.rateLimitRetry || "You can now try uploading again.";
        return;
      }
      const timeStr = formatTimeLeft(secondsLeft);
      const waitText = uploadForm.dataset.rateLimitWait || "Wait:";
      uploadStatus.innerText = `${errorMsg} (${waitText} ${timeStr})`;
      secondsLeft--;
      window.uploadRateLimitTimer = setTimeout(updateCounter, 1000);
    };

    updateCounter();
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const formData = new FormData(uploadForm);
      submitUploadBtn.disabled = true;
      
      const prevText = submitUploadBtn.innerText;
      submitUploadBtn.innerText = uploadForm.dataset.loading;
      uploadStatus.className = "hidden";
      if (prLink) prLink.classList.add("hidden");
      
      try {
        const response = await fetch("/api/soundboard/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        uploadStatus.className = "";
        if (response.ok) {
          uploadStatus.style.color = "#10b981";
          uploadStatus.innerText = uploadForm.dataset.success;
          uploadForm.reset();
          if (folderSelect) folderSelect.dispatchEvent(new Event("change"));
          if (prLink && result.prUrl) {
            prLink.href = result.prUrl;
            prLink.classList.remove("hidden");
          }
        } else {
          uploadStatus.style.color = "#ef4444";
          const errorMsg = result.error || uploadForm.dataset.error;
          uploadStatus.innerText = errorMsg;

          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            if (retryAfter) handleRateLimit(retryAfter, errorMsg);
          }
        }
      } catch (err) {
        uploadStatus.className = "";
        uploadStatus.style.color = "#ef4444";
        uploadStatus.innerText = uploadForm.dataset.connectionError;
      } finally {
        submitUploadBtn.disabled = false;
        submitUploadBtn.innerText = prevText;
      }
    });
  }
});
