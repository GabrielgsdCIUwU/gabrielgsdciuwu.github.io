/**
 * @fileoverview Testimonials controller for the Chill section.
 * Handles fetching approved community testimonials and submitting new comments via AJAX
 * with complete localization (l10n) support.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadApprovedComments();
    initCommentFormHandler();
});

/**
 * Attaches the submit handler to the testimonial submission form.
 */
function initCommentFormHandler() {
    const formElement = document.getElementById('chill-comment-form');
    if (!formElement) return;

    const i18n = window.chillfishCommentsi18n || {
        submitting: 'Sending...',
        alerts: {
            successTitle: 'Submitted',
            successMessage: 'Your comment has been received and is pending review.',
            errorTitle: 'Error',
            errorMessage: 'Could not submit comment.',
            networkError: 'Network error occurred.'
        }
    };

    formElement.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = formElement.querySelector('button[type="submit"]');
        if (!submitButton) return;

        const originalButtonHtml = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i18n.submitting}`;

        const nameInput = document.getElementById('cf-name');
        const roleSelect = document.getElementById('cf-role');
        const commentTextarea = document.getElementById('cf-comment');

        const payload = {
            nombre: nameInput ? nameInput.value.trim() : '',
            rol: roleSelect ? roleSelect.value : '',
            comentario: commentTextarea ? commentTextarea.value.trim() : ''
        };

        try {
            const response = await fetch('/api/chillfish/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (window.toastr) {
                    toastr.success(i18n.alerts.successMessage, i18n.alerts.successTitle);
                }
                formElement.reset();
            } else {
                if (window.toastr) {
                    toastr.error(i18n.alerts.errorMessage, i18n.alerts.errorTitle);
                }
            }
        } catch (error) {
            console.error('Network error submitting comment:', error);
            if (window.toastr) {
                toastr.error(i18n.alerts.networkError, i18n.alerts.errorTitle);
            }
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHtml;
        }
    });
}

/**
 * Asynchronously fetches and displays approved community comments from the backend API.
 */
async function loadApprovedComments() {
    const commentsContainer = document.getElementById('chill-comments-list');
    if (!commentsContainer) return;

    const i18n = window.chillfishCommentsi18n || {
        empty: 'No testimonials yet.'
    };

    try {
        const pathSegments = window.location.pathname.split('/');
        const currentLang = pathSegments[1] || 'en';

        const response = await fetch(`/api/${currentLang}/chillfish/comments`);
        const commentsList = await response.json();

        if (!Array.isArray(commentsList) || commentsList.length === 0) {
            commentsContainer.innerHTML = `
                <div class="bg-[#12121a] border border-neutral-800 rounded-xl p-8 text-center">
                    <i class="fas fa-comment-slash text-neutral-600 text-4xl mb-4"></i>
                    <p class="text-neutral-400">${i18n.empty}</p>
                </div>`;
            return;
        }

        commentsContainer.innerHTML = commentsList.map((item) => `
            <div class="bg-[#12121a] border border-neutral-800 rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                <p class="text-neutral-300 leading-relaxed mb-4 text-sm">"${item.comentario}"</p>
                <div class="flex items-center justify-between border-t border-neutral-800 pt-4">
                    <div>
                        <p class="text-white font-medium text-sm">${item.nombre}</p>
                        <p class="text-xs text-blue-400">${item.rol}</p>
                    </div>
                    <span class="text-xs text-neutral-400">
                        ${new Date(item.date || Date.now()).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching approved comments:', error);
    }
}
