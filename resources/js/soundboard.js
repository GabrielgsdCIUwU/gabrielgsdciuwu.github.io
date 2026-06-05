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
          uploadStatus.innerText = result.error || uploadForm.dataset.error;
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
