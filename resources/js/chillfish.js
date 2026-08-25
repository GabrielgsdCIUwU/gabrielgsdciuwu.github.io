/**
 * @fileoverview Main interaction controller for the Chill section.
 * Manages hero particles, scroll reveal effects, ecosystem node toggles, and gallery carousel lightbox.
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeroParticles();
    initScrollRevealObserver();
    initEcosystemAccordion();
    initGalleryController();
});

/**
 * Initializes floating ambient particles within the hero section.
 */
function initHeroParticles() {
    const heroContainer = document.getElementById('hero-particles');
    if (!heroContainer) return;

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 rounded-full bg-blue-500/20 animate-particle';

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 3}s`;
        particle.style.animationDuration = `${3 + Math.random() * 2}s`;

        heroContainer.appendChild(particle);
    }
}

/**
 * Sets up an IntersectionObserver to reveal elements gracefully on scroll.
 */
function initScrollRevealObserver() {
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-4');
                entry.target.classList.add('opacity-100', 'translate-y-0');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach((element) => {
        element.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-4');
        scrollObserver.observe(element);
    });

    window.chillScrollObserver = scrollObserver;
}

/**
 * Handles expanding and collapsing nodes in the FISH ecosystem hierarchy tree.
 */
function initEcosystemAccordion() {
    const ecosystemNodes = document.querySelectorAll('.ecosystem-node');

    function collapseNode(button) {
        const detailId = button.getAttribute('aria-controls');
        const detailElement = document.getElementById(detailId);
        const chevron = button.querySelector('.ecosystem-chevron');
        const wrapper = button.closest('.ecosystem-node-wrapper');
        const pulse = wrapper?.previousElementSibling?.querySelector?.('.ecosystem-connector-pulse');

        button.setAttribute('aria-expanded', 'false');
        if (detailElement) {
            detailElement.style.maxHeight = '0';
            detailElement.style.opacity = '0';
        }
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
        if (pulse) {
            pulse.style.opacity = '0';
        }
    }

    function expandNode(button) {
        const detailId = button.getAttribute('aria-controls');
        const detailElement = document.getElementById(detailId);
        const chevron = button.querySelector('.ecosystem-chevron');
        const wrapper = button.closest('.ecosystem-node-wrapper');
        const pulse = wrapper?.previousElementSibling?.querySelector?.('.ecosystem-connector-pulse');

        button.setAttribute('aria-expanded', 'true');
        if (detailElement) {
            detailElement.style.maxHeight = `${detailElement.scrollHeight}px`;
            detailElement.style.opacity = '1';
        }
        if (chevron) {
            chevron.style.transform = 'rotate(180deg)';
        }
        if (pulse) {
            pulse.style.opacity = '1';
        }
    }

    ecosystemNodes.forEach((node) => {
        node.addEventListener('click', () => {
            const isExpanded = node.getAttribute('aria-expanded') === 'true';

            ecosystemNodes.forEach((otherNode) => {
                if (otherNode !== node) collapseNode(otherNode);
            });

            if (isExpanded) {
                collapseNode(node);
            } else {
                expandNode(node);
            }
        });
    });
}

/**
 * Controller for fetching pictures, rendering gallery grid, modal lightbox with carousel controls, and filter dropdown.
 */
function initGalleryController() {
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryEmptyState = document.getElementById('gallery-empty-state');
    const gallerySelectBtn = document.getElementById('gallery-select-btn');
    const gallerySelectLabel = document.getElementById('gallery-select-label');
    const gallerySelectDropdown = document.getElementById('gallery-select-dropdown');
    const galleryOptionsContainer = document.getElementById('gallery-options-container');

    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const modalClose = document.getElementById('gallery-modal-close');
    const modalPrev = document.getElementById('gallery-modal-prev');
    const modalNext = document.getElementById('gallery-modal-next');
    const modalMeetup = document.getElementById('gallery-modal-meetup');
    const modalSession = document.getElementById('gallery-modal-session');
    const modalAuthor = document.getElementById('gallery-modal-author');
    const modalInfo = document.getElementById('gallery-modal-info');

    let allPictures = [];
    let currentDisplayedPictures = [];
    let currentModalIndex = 0;

    const i18nGallery = window.chillfishGalleryi18n || {
        empty: 'No images available',
        filterAll: 'All Meetups',
        euSession: 'EU Session',
        usSession: 'US Session',
        by: 'by'
    };

    function updateModalContent(index) {
        if (!currentDisplayedPictures || currentDisplayedPictures.length === 0) return;

        currentModalIndex = (index + currentDisplayedPictures.length) % currentDisplayedPictures.length;
        const picture = currentDisplayedPictures[currentModalIndex];

        if (!modalImg) return;

        modalImg.src = picture.url;
        if (modalMeetup) modalMeetup.textContent = `Meetup ${picture.meetupNumber}`;
        if (modalSession) modalSession.textContent = picture.session === 0 ? i18nGallery.euSession : i18nGallery.usSession;

        if (modalAuthor && picture.author) {
            modalAuthor.textContent = `${i18nGallery.by} ${picture.author}`;
            modalAuthor.classList.remove('hidden');
            if (modalAuthor.previousElementSibling) {
                modalAuthor.previousElementSibling.classList.remove('hidden');
            }
        } else if (modalAuthor) {
            modalAuthor.classList.add('hidden');
            if (modalAuthor.previousElementSibling) {
                modalAuthor.previousElementSibling.classList.add('hidden');
            }
        }
    }

    function openModal(index) {
        if (!modal || !modalImg) return;

        updateModalContent(index);

        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');

        setTimeout(() => {
            modalImg.classList.remove('scale-95');
            modalImg.classList.add('scale-100');
            if (modalInfo) {
                modalInfo.classList.remove('translate-y-4', 'opacity-0');
                modalInfo.classList.add('translate-y-0', 'opacity-100');
            }
        }, 50);

        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal || !modalImg) return;

        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');

        modalImg.classList.remove('scale-100');
        modalImg.classList.add('scale-95');
        if (modalInfo) {
            modalInfo.classList.remove('translate-y-0', 'opacity-100');
            modalInfo.classList.add('translate-y-4', 'opacity-0');
        }

        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalPrev) {
        modalPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            updateModalContent(currentModalIndex - 1);
        });
    }

    if (modalNext) {
        modalNext.addEventListener('click', (e) => {
            e.stopPropagation();
            updateModalContent(currentModalIndex + 1);
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            const isClickInsideControls = modalImg?.contains(e.target) || modalInfo?.contains(e.target) || modalPrev?.contains(e.target) || modalNext?.contains(e.target);
            if (!isClickInsideControls) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('hidden')) return;

            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') updateModalContent(currentModalIndex - 1);
            if (e.key === 'ArrowRight') updateModalContent(currentModalIndex + 1);
        });
    }

    function renderGallery(pictures) {
        if (!galleryGrid) return;

        currentDisplayedPictures = [];

        Array.from(galleryGrid.children).forEach((child) => {
            if (child !== galleryEmptyState) child.remove();
        });

        if (!pictures || pictures.length === 0) {
            if (galleryEmptyState) galleryEmptyState.classList.remove('hidden');
            return;
        }

        if (galleryEmptyState) galleryEmptyState.classList.add('hidden');

        const grouped = pictures.reduce((accumulator, pic) => {
            if (!accumulator[pic.meetupNumber]) accumulator[pic.meetupNumber] = [];
            accumulator[pic.meetupNumber].push(pic);
            return accumulator;
        }, {});

        const sortedMeetups = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
        let delayCounter = 0;

        sortedMeetups.forEach((meetupNumber) => {
            const headerContainer = document.createElement('div');
            headerContainer.className = 'col-span-full mt-8 mb-2 border-b border-neutral-800/50 pb-2 flex items-center justify-between reveal-on-scroll opacity-0 translate-y-4 transition-all duration-500';

            const headerTitle = document.createElement('h3');
            headerTitle.className = 'text-2xl font-light text-white flex items-center gap-3';
            headerTitle.innerHTML = `<span class="text-blue-400 font-mono text-xl">&lt;</span> Meetup ${meetupNumber} <span class="text-blue-400 font-mono text-xl">&gt;</span>`;

            const countBadge = document.createElement('span');
            countBadge.className = 'text-xs font-mono text-neutral-500 bg-[#12121a] px-3 py-1 rounded-full border border-neutral-800';
            countBadge.textContent = `${grouped[meetupNumber].length} photos`;

            headerContainer.appendChild(headerTitle);
            headerContainer.appendChild(countBadge);
            galleryGrid.appendChild(headerContainer);

            if (window.chillScrollObserver) {
                window.chillScrollObserver.observe(headerContainer);
            }

            const meetupPics = grouped[meetupNumber].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            meetupPics.forEach((pic) => {
                const pictureIndex = currentDisplayedPictures.length;
                currentDisplayedPictures.push(pic);

                const wrapper = document.createElement('div');
                wrapper.className = 'group relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-[#12121a] border border-neutral-800 reveal-on-scroll transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] opacity-0 translate-y-4';
                wrapper.style.transitionDelay = `${(delayCounter % 15) * 50}ms`;
                delayCounter++;

                const img = document.createElement('img');
                img.src = pic.url;
                img.className = 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105';
                img.loading = 'lazy';

                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4';

                const sessionName = pic.session === 0 ? i18nGallery.euSession : i18nGallery.usSession;
                const authorHTML = pic.author ? `<p class="text-neutral-400 text-xs mt-1">${i18nGallery.by} ${pic.author}</p>` : '';

                overlay.innerHTML = `
                    <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span class="inline-block px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono mb-2 backdrop-blur-sm border border-blue-500/20">${sessionName}</span>
                        ${authorHTML}
                    </div>
                `;

                wrapper.appendChild(img);
                wrapper.appendChild(overlay);
                wrapper.addEventListener('click', () => openModal(pictureIndex));

                galleryGrid.appendChild(wrapper);

                if (window.chillScrollObserver) {
                    window.chillScrollObserver.observe(wrapper);
                }
            });
        });
    }

    function populateGalleryDropdown(pictures) {
        if (!galleryOptionsContainer) return;

        galleryOptionsContainer.innerHTML = '';
        const uniqueMeetups = [...new Set(pictures.map((p) => p.meetupNumber))].sort((a, b) => Number(b) - Number(a));

        uniqueMeetups.forEach((meetup) => {
            const count = pictures.filter((p) => p.meetupNumber === meetup).length;
            const option = document.createElement('div');
            option.className = 'p-4 hover:bg-blue-500/10 cursor-pointer text-sm font-medium transition-all duration-300 text-neutral-300 hover:text-white flex items-center justify-between border-b border-neutral-800/50 last:border-0 group';
            option.dataset.filter = meetup;
            option.innerHTML = `
                <div class="flex items-center gap-3">
                    <i class="fas fa-camera text-neutral-500 group-hover:text-blue-400 transition-colors w-4 text-center"></i>
                    <span>Meetup ${meetup}</span>
                </div>
                <span class="bg-neutral-800/50 text-neutral-400 text-xs py-1 px-2 rounded-md group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">${count}</span>
            `;
            galleryOptionsContainer.appendChild(option);
        });

        if (gallerySelectBtn && gallerySelectDropdown) {
            gallerySelectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                gallerySelectDropdown.classList.toggle('hidden');
                const chevronIcon = gallerySelectBtn.querySelector('.fa-chevron-down');
                if (chevronIcon) {
                    chevronIcon.style.transform = gallerySelectDropdown.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            });

            document.addEventListener('click', (e) => {
                const container = document.getElementById('gallery-dropdown-container');
                if (container && !container.contains(e.target)) {
                    gallerySelectDropdown.classList.add('hidden');
                    const chevronIcon = gallerySelectBtn.querySelector('.fa-chevron-down');
                    if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
                }
            });
        }

        if (gallerySelectDropdown) {
            gallerySelectDropdown.querySelectorAll('div[data-filter]').forEach((option) => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filterValue = option.dataset.filter;

                    gallerySelectDropdown.classList.add('hidden');
                    const chevronIcon = gallerySelectBtn?.querySelector('.fa-chevron-down');
                    if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';

                    if (filterValue === 'all') {
                        if (gallerySelectLabel) gallerySelectLabel.textContent = i18nGallery.filterAll;
                        renderGallery(allPictures);
                    } else {
                        if (gallerySelectLabel) gallerySelectLabel.textContent = `Meetup ${filterValue}`;
                        renderGallery(allPictures.filter((p) => String(p.meetupNumber) === String(filterValue)));
                    }
                });
            });
        }

        const searchInput = document.getElementById('gallery-search');
        if (searchInput) {
            searchInput.addEventListener('click', (e) => e.stopPropagation());
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                gallerySelectDropdown?.querySelectorAll('#gallery-options-container > div').forEach((option) => {
                    const labelText = option.querySelector('span')?.textContent.toLowerCase() || '';
                    option.style.display = labelText.includes(searchTerm) ? 'flex' : 'none';
                });
            });
        }
    }

    if (galleryGrid) {
        fetch('/api/chillfish/pictures')
            .then((response) => response.json())
            .then((pictures) => {
                if (Array.isArray(pictures)) {
                    allPictures = pictures;
                    populateGalleryDropdown(allPictures);
                    renderGallery(allPictures);
                }
            })
            .catch((error) => {
                console.error('Error fetching gallery pictures:', error);
                if (galleryEmptyState) galleryEmptyState.classList.remove('hidden');
            });
    }
}