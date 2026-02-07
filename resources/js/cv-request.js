document.addEventListener('DOMContentLoaded', () => {
    const btnRequest = document.getElementById('btn-request-cv');
    const modal = document.getElementById('cv-modal');
    const btnCancel = document.getElementById('cv-cancel');
    const form = document.getElementById('cv-form');
    const submitBtn = document.getElementById('cv-submit');

    const currentLang = globalThis.location.pathname.split('/')[1] || 'en';

    // Abrir Modal
    if (btnRequest) {
        btnRequest.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
        });
    }

    function closeModal() {
        modal.classList.add('hidden');
        form.reset();
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', closeModal);
    }

    globalThis.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const company = document.getElementById('cv-company').value;
            const email = document.getElementById('cv-email').value;
            
            const originalText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const response = await fetch('/api/request-cv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        company,
                        email,
                        lang: currentLang
                    })
                });

                if (response.ok) {
                    toastr.success(cvMessages.success);
                    closeModal();
                } else {
                    toastr.error(cvMessages.error);
                }
            } catch (error) {
                console.error(error);
                toastr.error(cvMessages.error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        });
    }
});