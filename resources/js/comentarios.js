let currentIndex = 0;
let autoSlideInterval = null; // Intervalo global para todos los carruseles
const carouselInnerIds = ["carousel-inner-1", "carousel-inner-2", "carousel-inner-3"];
const totalSlides = {}; // Guardar el número de diapositivas para cada carrusel
let isEditing = false; // Para controlar si estamos en modo de edición

async function cargarComentarios() {
  try {
    const response = await fetch("/api/comments");
    const comentarios = await response.json();

    // Dividir los comentarios entre los tres carruseles
    const carrusel1 = comentarios.filter((_, index) => index % 3 === 0);
    const carrusel2 = comentarios.filter((_, index) => index % 3 === 1);
    const carrusel3 = comentarios.filter((_, index) => index % 3 === 2);

    cargarComentariosEnCarrusel(carrusel1, "carousel-inner-1");
    cargarComentariosEnCarrusel(carrusel2, "carousel-inner-2");
    cargarComentariosEnCarrusel(carrusel3, "carousel-inner-3");

    initializeCarousels();
  } catch (error) {
    console.error("Error al cargar los comentarios:", error);
  }
}

function cargarComentariosEnCarrusel(comentarios, carouselInnerId) {
  const carouselInner = document.getElementById(carouselInnerId);
  comentarios.forEach((comentario) => {
    const comentarioDiv = document.createElement("div");
    comentarioDiv.classList.add("w-full", "flex-shrink-0", "p-4", "tweet-style");
    comentarioDiv.dataset.id = comentario.id; // Agrega un ID al comentario para edición

    comentarioDiv.innerHTML = `
      <div class="user-info">
          <div class="username">${comentario.nombre}</div>
      </div>
      <div class="content comment-container">
          <p class="text-gray-700 mb-2 comment-text" id="comment-${comentario.id}">${comentario.comentario}</p>
          <textarea id="edit-input-${comentario.id}" class="hidden comment-input" rows="3" placeholder="Pon aquí tu comentario">${comentario.comentario}</textarea>
          <input type="text" id="edit-name-${comentario.id}" class="hidden comment-input" placeholder="Pon aquí tu nombre" value="${comentario.nombre}" />
          <button class="hidden" id="save-btn-${comentario.id}">Guardar</button>
      </div>
    `;

    carouselInner.appendChild(comentarioDiv);
  });
  totalSlides[carouselInnerId] = carouselInner.children.length;
}

function initializeCarousels() {
  carouselInnerIds.forEach((id) => {
    const carouselInner = document.getElementById(id);
    if (carouselInner && totalSlides[id] > 1) {
      carouselInner.classList.add("carousel-transition"); // Añadir la clase de transición
    }
  });

  // Configurar botones
  const prevButton = document.getElementById("prev-slide");
  const nextButton = document.getElementById("next-slide");
  const editButton = document.getElementById("edit-comment-btn");

  if (prevButton && nextButton && editButton) {
    nextButton.addEventListener("click", () => {
      if (!isEditing) nextSlide();
    });
    prevButton.addEventListener("click", () => {
      if (!isEditing) prevSlide();
    });
    editButton.addEventListener("click", () => toggleEditMode("carousel-inner-2"));
  } else {
    console.error("Botones de navegación no encontrados.");
  }

  startAutoSlide(); // Iniciar el deslizador automático para todos los carruseles
}

function showSlide(index) {
  carouselInnerIds.forEach((id) => {
    const carouselInner = document.getElementById(id);
    if (carouselInner) {
      carouselInner.style.transform = `translateX(-${index * 100}%)`;
    }
  });
}

function startAutoSlide() {
  stopAutoSlide();
  autoSlideInterval = setInterval(() => {
    if (!isEditing) nextSlide();
  }, 8000);
}

function stopAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
  }
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % totalSlides[carouselInnerIds[0]]; // Usa el primer carrusel para el total de diapositivas
  showSlide(currentIndex);
}

function prevSlide() {
  currentIndex = (currentIndex - 1 + totalSlides[carouselInnerIds[0]]) % totalSlides[carouselInnerIds[0]];
  showSlide(currentIndex);
}

function toggleEditMode(carouselInnerId) {
  const carouselInner = document.getElementById(carouselInnerId);
  

  if (isEditing) {
    // Guardar los cambios y salir del modo de edición
    saveAllComments(carouselInnerId);
    isEditing = false;
    startAutoSlide(); // Reiniciar el deslizador automático después de guardar

    // Volver a aplicar la transición
    if (carouselInner) {
      carouselInner.classList.remove("no-transition");
      carouselInner.classList.add("carousel-transition");
      carouselInner.style.transform = ""; // Eliminar el estilo en línea
    }
  } else {
    // Entrar en modo de edición
    isEditing = true;
    stopAutoSlide(); // Detener el deslizador automático durante la edición

    // Eliminar la transición
    if (carouselInner) {
      carouselInner.classList.remove("carousel-transition");
      carouselInner.classList.add("no-transition");
      carouselInner.style.transform = ""; // Eliminar el estilo en línea
    }

    if (carouselInnerId === "carousel-inner-2") {
      clearCarousel(carouselInnerId, true);
      renderEditFields();
    } else {
      document.querySelectorAll(`#${carouselInnerId} .tweet-style`).forEach((div) => {
        const commentId = div.dataset.id;
        const commentText = div.querySelector(`#comment-${commentId}`);
        const editInput = div.querySelector(`#edit-input-${commentId}`);
        const editName = div.querySelector(`#edit-name-${commentId}`);
        const saveButton = div.querySelector(`#save-btn-${commentId}`);

        commentText.classList.add("hidden");
        editInput.classList.remove("hidden");
        editName.classList.remove("hidden");
        saveButton.classList.remove("hidden");

        // Ajustar el tamaño del contenedor mientras se escribe
        editInput.addEventListener("input", () => adjustCommentContainerHeight(div));
        editName.addEventListener("input", () => adjustCommentContainerHeight(div));

        saveButton.addEventListener("click", () =>
          saveComment(commentId, editInput.value, editName.value, carouselInnerId)
        );
      });
    }
  }
}

function clearCarousel(carouselInnerId, keepNewEditField = false) {
  const carouselInner = document.getElementById(carouselInnerId);
  while (carouselInner.firstChild) {
    if (!keepNewEditField || carouselInner.firstChild.id !== "edit-fields") {
      carouselInner.removeChild(carouselInner.firstChild);
    } else {
      break;
    }
  }
}

function renderEditFields() {
  const carouselInner = document.getElementById("carousel-inner-2");
  const editDiv = document.createElement("div");
  editDiv.classList.add("w-full", "flex-shrink-0", "p-4", "tweet-style");
  editDiv.id = "edit-fields"; // Añadir un id para identificar fácilmente

  editDiv.innerHTML = `
    <div class="user-info">
      <input type="text" id="new-name" class="comment-input" placeholder="Pon tu nombre" />
    </div>
    <div class="content comment-container">
      <textarea id="new-comment" class="comment-input" rows="3" placeholder="Pon tu comentario"></textarea>
      <button id="save-new-comment" class="mt-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none">Guardar</button>
    </div>
  `;

  carouselInner.appendChild(editDiv);

  document.getElementById("save-new-comment").addEventListener("click", () => saveNewComment());
}

function saveNewComment() {
  const nameInput = document.getElementById("new-name");
  const commentInput = document.getElementById("new-comment");

  if (nameInput.value.trim() && commentInput.value.trim()) {
    // Aquí iría la lógica para guardar el nuevo comentario, por ejemplo:
    // fetch("/api/comments", { method: 'POST', body: JSON.stringify(newComment) });
    async function submitComment() {
        try {
            const name = nameInput.value.trim();
            const comment = commentInput.value.trim();

            const response = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre: name, comentario: comment }),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error al enviar el comentario:", error)
            alert("Error al enviar el comentario.")
        }
    }

     submitComment();
    console.log(`Nuevo comentario guardado. Nombre: ${nameInput.value.trim()}, comentario: ${commentInput.value.trim()}`);
    alert(`Tu comentario esta en revisión, muchas gracias ❤️`)
    location.reload();
    // Opcionalmente, podrías recargar los comentarios después de guardar
    // cargarComentarios();
    
  } else {
    alert("Por favor, rellena ambos campos.");
  }
}

function saveComment(commentId, newComment, newName, carouselInnerId) {
  // Implementa la lógica para guardar el comentario editado
  console.log(`Comentario ${commentId} guardado con nombre ${newName} y comentario ${newComment}`);
  toggleEditMode("carousel-inner-2");
}

function saveAllComments(carouselInnerId) {
  document.querySelectorAll(`#${carouselInnerId} .tweet-style`).forEach((div) => {
    const commentId = div.dataset.id;
    const editInput = div.querySelector(`#edit-input-${commentId}`);
    const editName = div.querySelector(`#edit-name-${commentId}`);
    if (!editInput.classList.contains("hidden")) {
      saveComment(commentId, editInput.value, editName.value, carouselInnerId);
    }
  });
}

function adjustCommentContainerHeight(container) {
  const editInput = container.querySelector(".comment-input");

  editInput.style.height = "auto"; // Para calcular la altura correcta
  editInput.style.height = `${editInput.scrollHeight}px`; // Ajusta la altura al contenido
}

window.addEventListener("DOMContentLoaded", cargarComentarios);
