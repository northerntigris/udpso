export class SchoolRegistrationModal {
    static async open() {
        try {
            const response = await fetch('register-school-modal.html');
            const modalHTML = await response.text();

            const modalStructure = `
                <div class="modal-overlay">
                    ${modalHTML}
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalStructure);
            document.body.classList.add('no-scroll');

            this.#setupModal();
        } catch(error) {
            console.error('Ошибка загрузки окна регистрации: ', error);
        }
    }

    static #setupModal() {
        const overlay = document.querySelector('.modal-overlay');
        const modal = overlay.querySelector('#register-school-modal');
        const closeBtn = overlay.querySelector('.close-modal');

        modal.style.display = 'flex';

        closeBtn?.addEventListener('click', this.close);

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        const form = document.getElementById('register-school-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    full_name: document.getElementById('school-full-name').value,
                    address: document.getElementById('school-address').value,
                    ogrn: document.getElementById('school-ogrn').value,
                    registration_date: document.getElementById('school-ogrn-date').value,
                    director_fio: document.getElementById('director-fio').value,
                    director_inn: document.getElementById('director-inn').value,
                    director_position: document.getElementById('director-position').value
                };

                try {
                    const response = await fetch('api/register-school-by-organizer.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        alert('Заявка отправлена. Мы свяжемся с вами для подтверждения регистрации.');
                        this.close();
                    } else {
                        alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                    }
                } catch(error) {
                    console.error('Ошибка при отправке формы: ', error);
                    alert('Произошла ошибка при отправке формы. Пожалуйста, попробуйте позже.');
                }
            });
        }
    }

    static close() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
            document.body.classList.remove('no-scroll');
        }
    }
}
