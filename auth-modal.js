import { SidebarLoader } from './sidebar.js';

export class AuthModal {
    static async open() {
        try {
            const response = await fetch('auth-modal.html');
            const authModalHTML = await response.text();

            // Создаем полную структуру модального окна с оверлеем
            const modalStructure = `
                <div class="modal-overlay">
                    ${authModalHTML}
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalStructure);
            document.body.classList.add('no-scroll');

            // Настраиваем модальное окно
            this.#setupModal();
        } catch(error) {
            console.error('Ошибка загрузки окна авторизации: ', error);
        }
    }

    static #setupModal() {
        const overlay = document.querySelector('.modal-overlay');
        const authModal = document.querySelector('#auth-modal');
        const closeBtn = document.querySelector('.close-modal');

        // Применяем стили для модального окна
        if (authModal) {
            authModal.classList.add('modal-active');
        }

        // Закрытие по кнопке
        closeBtn?.addEventListener('click', this.close);

        // Закрытие по клику вне формы
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // Добавляем обработчик формы
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-id').value;
            const password = document.getElementById('login-password').value;

            if (!username || !password) {
                console.error('Поля не заполнены');
                return;
            }

            try {
                const response = await fetch('login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                if (!response.ok) {
                    throw new Error('Ошибка сети');
                }

                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('userRole', data.user_role);

                    if (data.user_role === 'student') {
                        localStorage.setItem('redirectAfterLogin', 'true');
                        localStorage.setItem('redirectTo', 'dashboard-student.html');
                    } else if (data.user_role === 'organizer') {
                        localStorage.setItem('redirectAfterLogin', 'true');
                        localStorage.setItem('redirectTo', 'dashboard-organizer.html');
                    }

                    this.close();
                    this.updateAuthUI(true);

                    SidebarLoader.updateUserMenu();

                    location.reload();
                } else {
                    console.error('Ошибка: ', data.error);
                }
            } catch(error) {
                console.error('Ошибка при отправке формы: ', error);
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

    static updateAuthUI(isLoggedIn) {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn && logoutBtn) {
            if (isLoggedIn) {
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'flex';
            } else {
                loginBtn.style.display = 'flex';
                logoutBtn.style.display = 'none';
            }
        }
    }
}