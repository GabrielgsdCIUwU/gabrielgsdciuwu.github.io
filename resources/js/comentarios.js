let autoSlideInterval;
const slideInterval = 10000;

const track = document.getElementById("main-carousel-inner");
const prevButton = document.getElementById("prev-slide");
const nextButton = document.getElementById("next-slide");
const editCommentBtn = document.getElementById("edit-comment-btn");
const commentForm = document.getElementById("comment-form");
const cancelCommentBtn = document.getElementById("cancel-comment");

let allComments = [];
let currentIndex = 0;
let isAutoSliding = true;

function getItemsPerSlide() {
  if (window.innerWidth < 768) return 1;
  if (window.innerWidth < 1024) return 2;
  return 3;
}

async function loadComments() {
  try {
    const lang = window.location.pathname.split("/")[1] || "en";
    const response = await fetch(`/api/${lang}/comments`);
    allComments = await response.json();

    if (!allComments || allComments.length == 0) return;
    
    renderCarousel();
    startAutoSlide();

  } catch (error) {
    console.error("Error al cargar los comentarios: ", error);
  }
}

function renderCarousel() {
  if (!track) return;

  const itemsPerSlide = getItemsPerSlide();
  const slidesHtml = [];

  for (let i = 0; i < allComments.length; i += itemsPerSlide) {
    const chunk = allComments.slice(i, i + itemsPerSlide);

    const cardsHtml = chunk
      .map(
        (comment) => `
      <div class="card-wrapper">
        <div class="carousel-content">
          <p class="name">${comment.nombre}</p>
          <p class="comment">${comment.comentario}</p>
        </div>
      </div>
    `
      )
      .join("");

    let placeholders = "";
    if (chunk.length < itemsPerSlide) {
      for (let j = 0; j < itemsPerSlide - chunk.length; j++) {
        placeholders += `<div class="card-wrapper" style="visibility: hidden;"></div>`;
      }
    }

    slidesHtml.push(`
      <div class="carousel-slide">
        ${cardsHtml}
        ${placeholders}
      </div>
    `);
  }

  track.innerHTML = slidesHtml.join("");

  const totalSlides = Math.ceil(allComments.length / itemsPerSlide);
  if (currentIndex >= totalSlides) currentIndex = 0;

  updateCarouselPosition();
}

function updateCarouselPosition() {
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
}

function startAutoSlide() {
  stopAutoSlide();
  autoSlideInterval = setInterval(() => {
    if (isAutoSliding) {
      goToNext();
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

function goToNext() {
  if(!allComments.length) return;
  const itemsPerSlide = getItemsPerSlide();
  const totalSlides = Math.ceil(allComments.length / itemsPerSlide);
  currentIndex = (currentIndex + 1) % totalSlides;
  updateCarouselPosition();
}

function goToPrev() {
  if(!allComments.length) return;
  const itemsPerSlide = getItemsPerSlide();
  const totalSlides = Math.ceil(allComments.length / itemsPerSlide);
  currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  updateCarouselPosition();
}


prevButton.addEventListener("click", () => {
  goToPrev();
  resetAutoSlide();
});

nextButton.addEventListener("click", () => {
  goToNext();
  resetAutoSlide();
});

const container = document.querySelector('.carousel-container');
if (container) {
  container.addEventListener("mouseenter", () => {
    isAutoSliding = false;
    stopAutoSlide();
  });

  container.addEventListener("mouseleave", () => {
    if (!commentForm || commentForm.classList.contains("hidden")) {
      isAutoSliding = true;
      startAutoSlide();
    }
  });
}

window.addEventListener('resize', () => {
  renderCarousel();
});

editCommentBtn.addEventListener("click", () => {
  isAutoSliding = false;
  stopAutoSlide();
  if (commentForm) {
      commentForm.classList.remove("hidden");
      const offsetTop = container.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }
});

if (cancelCommentBtn) {
    cancelCommentBtn.addEventListener("click", () => {
      if (commentForm) commentForm.classList.add("hidden");
      isAutoSliding = true;
      startAutoSlide();
    });
}

const submitBtn = document.getElementById("submit-comment");
if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const name = document.getElementById("comment-name").value;
      const comment = document.getElementById("comment-text").value;

      if (name && comment) {
        try {
          const response = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: name, comentario: comment }),
          });

          if (response.ok) {
            toastr.success(toastrMessages.successMessage, toastrMessages.successTitle);
            document.getElementById("comment-name").value = "";
            document.getElementById("comment-text").value = "";
            commentForm.classList.add("hidden");
            
            await loadComments();
            isAutoSliding = true;
            startAutoSlide();
          } else {
            toastr.error(toastrMessages.errorMessage, toastrMessages.errorTitle);
          }
        } catch (error) {
          console.log(error);
          toastr.error(toastrMessages.errorMessage, toastrMessages.errorTitle);
        }
      } else {
        toastr.warning(toastrMessages.warningMessage);
      }
    });
}

document.addEventListener("click", handleClickForm);

function handleClickForm(event) {
  if (commentForm && !commentForm.classList.contains("hidden")) {
    if (event.target === editCommentBtn) return;
    const content = commentForm.querySelector(".bg-white");
    if (content && !content.contains(event.target)) {
      commentForm.classList.add("hidden");
      isAutoSliding = true;
      startAutoSlide();
    }
  }
}


loadComments();