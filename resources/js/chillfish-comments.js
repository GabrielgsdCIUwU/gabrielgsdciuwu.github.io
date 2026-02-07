document.addEventListener('DOMContentLoaded', () => {
    loadChillComments();

    const form = document.getElementById('chill-comment-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            const name = document.getElementById('cf-name').value;
            const role = document.getElementById('cf-role').value;
            const comment = document.getElementById('cf-comment').value;

            try {
                const response = await fetch('/api/chillfish/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: name, rol: role, comentario: comment })
                });

                if (response.ok) {
                    toastr.success('Your comment is pending review.', 'Sent!');
                    form.reset();
                } else {
                    toastr.error('Could not submit comment.', 'Error');
                }
            } catch (error) {
                console.error(error);
                toastr.error('Network error.', 'Error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});

async function loadChillComments() {
    const container = document.getElementById('chill-comments-list');
    if (!container) return;

    try {
        const lang = window.location.pathname.split("/")[1] || "en";
        const response = await fetch(`/api/${lang}/chillfish/comments`);
        const comments = await response.json();
        console.log(comments);

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="bg-[#12121a] border border-neutral-800 rounded-xl p-8 text-center">
                    <i class="fas fa-comment-slash text-neutral-700 text-4xl mb-4"></i>
                    <p class="text-neutral-400">No testimonials yet.</p>
                </div>`;
            return;
        }

        container.innerHTML = comments.map(c => `
            <div class="bg-[#12121a] border border-neutral-800 rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                <p class="text-neutral-300 leading-relaxed mb-4 text-sm">"${c.comentario}"</p>
                <div class="flex items-center justify-between border-t border-neutral-800 pt-4">
                    <div>
                        <p class="text-white font-medium text-sm">${c.nombre}</p>
                        <p class="text-xs text-blue-400">${c.rol}</p>
                    </div>
                    <span class="text-xs text-neutral-600">
                        ${new Date(c.date || Date.now()).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error loading comments", error);
    }
}