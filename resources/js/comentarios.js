let autoSlideInterval;
const slideInterval = 10000;
const carousels = document.querySelectorAll(".carousel-inner");
const prevButton = document.getElementById("prev-slide");
const nextButton = document.getElementById("next-slide");
const editCommentBtn = document.getElementById("edit-comment-btn");
const commentForm = document.getElementById("comment-form");
const cancelCommentBtn = document.getElementById("cancel-comment");
let currentIndex = 0;
let isAutoSliding = true;

async function cargarComentarios() {
  try {
    const response = await fetch("/api/comments");
    const comentarios = await response.json();

    const carrusel1 = comentarios.filter((_, index) => index % 3 === 0);
    const carrusel2 = comentarios.filter((_, index) => index % 3 === 1);
    const carrusel3 = comentarios.filter((_, index) => index % 3 === 2);

    function agregarComentarios(carrusel, comentarios) {
      const inner = carrusel.querySelector(".carousel-inner");
      inner.innerHTML = comentarios
        .map(
          (comentario) => `
        <div class="carousel-slide">
          <div class="carousel-content">
            <p class="name">${comentario.nombre}</p>
            <p class="comment">${comentario.comentario}</p>
          </div>
        </div>
      `
        )
        .join("");
    }

    agregarComentarios(document.getElementById("carousel1"), carrusel1);
    agregarComentarios(document.getElementById("carousel2"), carrusel2);
    agregarComentarios(document.getElementById("carousel3"), carrusel3);

    function updateCarousels() {
      carousels.forEach((carousel) => {
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
      });
    }

    function startAutoSlide() {
      autoSlideInterval = setInterval(() => {
        if (isAutoSliding) {
          currentIndex = currentIndex < carousels[0].children.length - 1 ? currentIndex + 1 : 0;
          updateCarousels();
        }
      }, slideInterval);
    }

    function stopAutoSlide() {
      clearInterval(autoSlideInterval);
    }

    function resetAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }

    prevButton.addEventListener("click", () => {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : carousels[0].children.length - 1;
      updateCarousels();
      resetAutoSlide();
    });

    nextButton.addEventListener("click", () => {
      currentIndex = currentIndex < carousels[0].children.length - 1 ? currentIndex + 1 : 0;
      updateCarousels();
      resetAutoSlide();
    });

    editCommentBtn.addEventListener("click", () => {
      isAutoSliding = false;
      commentForm.classList.remove("hidden");
      const activeCarousel = document.querySelector(".carousel-inner").parentElement;
      const offsetTop = activeCarousel.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    });

    cancelCommentBtn.addEventListener("click", () => {
      commentForm.classList.add("hidden");
      isAutoSliding = true;
      resetAutoSlide();
    });

    document.getElementById("submit-comment").addEventListener("click", async () => {
      const name = document.getElementById("comment-name").value;
      const comment = document.getElementById("comment-text").value;

      if (name && comment) {
        try {
          const response = await fetch("/api/comments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre: name, comentario: comment }),
          });

          if (response.ok) {
            toastr.success("Gracias por tu comentario ❤️", "Enviado");
            document.getElementById("comment-name").value = "";
            document.getElementById("comment-text").value = "";
            commentForm.classList.add("hidden");
            isAutoSliding = true;
            resetAutoSlide();
          } else {
            toastr.error("Hubo un problema al enviar tu comentario. Por favor, intenta de nuevo.", "Error:");
          }
        } catch (error) {
          toastr.error("Hubo un problema al enviar tu comentario. Por favor, intenta de nuevo.", "Error:");
        }
      } else {
        toastr.warning("Tienes que rellenar ambos campos!");
      }
    });

    carousels.forEach((carousel) => {
      carousel.addEventListener("mouseenter", () => {
        stopAutoSlide();
      });
      carousel.addEventListener("mouseleave", () => {
        resetAutoSlide();
      });
    });

    updateCarousels();
    startAutoSlide();
  } catch (error) {
    console.error("Error al cargar los comentarios:", error);
  }
}

cargarComentarios();

document.addEventListener("click", handleClickForm);

function handleClickForm(event) {
  if (!commentForm.classList.contains("hidden")) {
    
    if (event.target === editCommentBtn) return;

    if (!commentForm.querySelector(".bg-white").contains(event.target)) {
      commentForm.classList.add("hidden");
      isAutoSliding = true;
    }
  }
}
