/**
 * @fileoverview Testimonials controller for the Chill section.
 * Handles fetching approved community testimonials and submitting new comments via AJAX.
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

    formElement.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = formElement.querySelector('button[type="submit"]');
        if (!submitButton) return;

        const originalButtonHtml = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const nameInput = document.getElementById('cf-name');
        const roleSelect = document.getElementById('cf-role');
        const commentTextarea = document.getElementById('cf-comment');

        const payload = {
            nombre: nameInput ? nameInput.value : '',
            rol: roleSelect ? roleSelect.value : '',
            comentario: commentTextarea ? commentTextarea.value : ''
        };

        try {
            const response = await fetch('/api/chillfish/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (window.toastr) {
                    toastr.success('Your comment is pending review.', 'Sent!');
                }
                formElement.reset();
            } else {
                if (window.toastr) {
                    toastr.error('Could not submit comment.', 'Error');
                }
            }
        } catch (error) {
            console.error('Network error submitting comment:', error);
            if (window.toastr) {
                toastr.error('Network error occurred.', 'Error');
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

    try {
        const pathSegments = window.location.pathname.split('/');
        const currentLang = pathSegments[1] || 'en';

        const response = await fetch(`/api/${currentLang}/chillfish/comments`);
        const commentsList = await response.json();

        if (!Array.isArray(commentsList) || commentsList.length === 0) {
            commentsContainer.innerHTML = `
                <div class="bg-[#12121a] border border-neutral-800 rounded-xl p-8 text-center">
                    <i class="fas fa-comment-slash text-neutral-700 text-4xl mb-4"></i>
                    <p class="text-neutral-400">No testimonials yet.</p>
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
                    <span class="text-xs text-neutral-600">
                        ${new Date(item.date || Date.now()).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching approved comments:', error);
    }
}