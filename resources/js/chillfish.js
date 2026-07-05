document.addEventListener('DOMContentLoaded', () => {

    const heroContainer = document.getElementById('hero-particles');
    if (heroContainer) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-1 h-1 rounded-full bg-blue-500/20 animate-particle';
            
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = 3 + Math.random() * 2;

            particle.style.left = `${left}%`;
            particle.style.top = `${top}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;

            heroContainer.appendChild(particle);
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-4');
                entry.target.classList.add('opacity-100', 'translate-y-0');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-4');
        observer.observe(el);
    });

    // --- GALLERY LOGIC ---
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryEmptyState = document.getElementById('gallery-empty-state');
    const gallerySelectBtn = document.getElementById('gallery-select-btn');
    const gallerySelectLabel = document.getElementById('gallery-select-label');
    const gallerySelectDropdown = document.getElementById('gallery-select-dropdown');
    const galleryOptionsContainer = document.getElementById('gallery-options-container');
    
    // Modal elements
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const modalClose = document.getElementById('gallery-modal-close');
    const modalMeetup = document.getElementById('gallery-modal-meetup');
    const modalSession = document.getElementById('gallery-modal-session');
    const modalAuthor = document.getElementById('gallery-modal-author');
    const modalInfo = document.getElementById('gallery-modal-info');
    
    let allPictures = [];
    const i18nGal = window.chillfishGalleryi18n || { empty: "No images", filterAll: "All Meetups" };

    function openModal(pic) {
        modalImg.src = pic.url;
        modalMeetup.textContent = `Meetup ${pic.meetupNumber}`;
        modalSession.textContent = pic.session === 0 ? i18nGal.euSession : i18nGal.usSession;
        
        if (modalAuthor && pic.author) {
            modalAuthor.textContent = `${i18nGal.by} ${pic.author}`;
            modalAuthor.classList.remove('hidden');
            modalAuthor.previousElementSibling.classList.remove('hidden'); // show the dot
        } else if (modalAuthor) {
            modalAuthor.classList.add('hidden');
            modalAuthor.previousElementSibling.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
        // trigger reflow
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        
        setTimeout(() => {
            modalImg.classList.remove('scale-95');
            modalImg.classList.add('scale-100');
            modalInfo.classList.remove('translate-y-4', 'opacity-0');
            modalInfo.classList.add('translate-y-0', 'opacity-100');
        }, 50);
        
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        
        modalImg.classList.remove('scale-100');
        modalImg.classList.add('scale-95');
        modalInfo.classList.remove('translate-y-0', 'opacity-100');
        modalInfo.classList.add('translate-y-4', 'opacity-0');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target !== modalImg && !modalInfo.contains(e.target)) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
        });
    }

    function renderGallery(pictures) {
        // Clear existing
        Array.from(galleryGrid.children).forEach(child => {
            if (child !== galleryEmptyState) child.remove();
        });

        if (!pictures || pictures.length === 0) {
            galleryEmptyState.classList.remove('hidden');
            return;
        }

        galleryEmptyState.classList.add('hidden');

        // Group by Meetup
        const grouped = pictures.reduce((acc, pic) => {
            if (!acc[pic.meetupNumber]) acc[pic.meetupNumber] = [];
            acc[pic.meetupNumber].push(pic);
            return acc;
        }, {});
        
        const sortedMeetups = Object.keys(grouped).sort((a, b) => b - a);

        let delayCounter = 0;

        sortedMeetups.forEach((meetupNumber) => {
            // Meetup Header
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
            observer.observe(headerContainer);

            // Sort pictures within meetup (latest first)
            const pics = grouped[meetupNumber].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            pics.forEach((pic) => {
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
                
                const sessionName = pic.session === 0 ? i18nGal.euSession : i18nGal.usSession;
                const authorHTML = pic.author ? `<p class="text-neutral-400 text-xs mt-1">${i18nGal.by} ${pic.author}</p>` : '';
                
                overlay.innerHTML = `
                    <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span class="inline-block px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono mb-2 backdrop-blur-sm border border-blue-500/20">${sessionName}</span>
                        ${authorHTML}
                    </div>
                `;

                wrapper.appendChild(img);
                wrapper.appendChild(overlay);
                
                wrapper.addEventListener('click', () => openModal(pic));
                
                galleryGrid.appendChild(wrapper);
                observer.observe(wrapper);
            });
        });
    }

    function populateGalleryDropdown(pictures) {
        if (!galleryOptionsContainer) return;
        
        galleryOptionsContainer.innerHTML = '';
        const uniqueMeetups = [...new Set(pictures.map(p => p.meetupNumber))].sort((a, b) => b - a);

        uniqueMeetups.forEach(meetup => {
            const opt = document.createElement('div');
            opt.className = 'p-4 hover:bg-[#1f1f2e] cursor-pointer text-sm font-medium transition-colors text-neutral-300 border-b border-neutral-800/50 last:border-0';
            opt.textContent = `Meetup ${meetup}`;
            opt.dataset.filter = meetup;
            galleryOptionsContainer.appendChild(opt);
        });

        // Dropdown toggle logic
        if (gallerySelectBtn) {
            gallerySelectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                gallerySelectDropdown.classList.toggle('hidden');
                const icon = gallerySelectBtn.querySelector('.fa-chevron-down');
                icon.style.transform = gallerySelectDropdown.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            });

            document.addEventListener('click', (e) => {
                const container = document.getElementById('gallery-dropdown-container');
                if (container && !container.contains(e.target)) {
                    gallerySelectDropdown.classList.add('hidden');
                    const icon = gallerySelectBtn.querySelector('.fa-chevron-down');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
            });
        }

        // Filter logic
        gallerySelectDropdown.querySelectorAll('div[data-filter]').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const filter = opt.dataset.filter;
                
                gallerySelectDropdown.classList.add('hidden');
                const icon = gallerySelectBtn.querySelector('.fa-chevron-down');
                if (icon) icon.style.transform = 'rotate(0deg)';
                
                if (filter === 'all') {
                    gallerySelectLabel.textContent = i18nGal.filterAll;
                    renderGallery(allPictures);
                } else {
                    gallerySelectLabel.textContent = `Meetup ${filter}`;
                    renderGallery(allPictures.filter(p => p.meetupNumber == filter));
                }
            });
        });
    }

    if (galleryGrid) {
        fetch('/api/chillfish/pictures')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    allPictures = data;
                    populateGalleryDropdown(allPictures);
                    renderGallery(allPictures);
                }
            })
            .catch(err => {
                console.error('Error fetching gallery', err);
                galleryEmptyState.classList.remove('hidden');
            });
    }
});