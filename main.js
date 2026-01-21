//main.js
import { SidebarLoader } from './sidebar.js';
import { NewsEditor } from './news-editor.js';
import { AuthModal } from './auth-modal.js';
import { SchoolRegistrationModal } from './school-registration-modal.js';

async function checkAuth() {
    try {
        const response = await fetch('check-auth.php');
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userRole', data.user_role);
            localStorage.setItem('isAuthenticated', 'true');
            AuthModal.updateAuthUI(true);
            SidebarLoader.updateUserMenu();

            SidebarLoader.setActiveItem(document.body.getAttribute('data-page'));

            // Скрываем кнопку регистрации школы для авторизованных пользователей
            const registerBtn = document.getElementById('register-school-btn');
            if (registerBtn) {
                registerBtn.style.display = 'none';
                // Также скрываем тултип
                const tooltip = document.querySelector('.register-tooltip');
                if (tooltip) tooltip.style.display = 'none';
            }

            const redirectAfterLogin = localStorage.getItem('redirectAfterLogin') === 'true';
            if (data.user_role === 'student' && redirectAfterLogin) {
                localStorage.removeItem('redirectAfterLogin');
                if (!window.location.pathname.endsWith('dashboard-student.html')) {
                    window.location.href = 'dashboard-student.html';
                    return;
                }
            }
        } else {
            localStorage.removeItem('userRole');
            localStorage.removeItem('isAuthenticated');
            AuthModal.updateAuthUI(false);
            SidebarLoader.updateUserMenu();

            if (document.body.getAttribute('data-page') === 'profile') {
                window.location.href = 'index.html';
                return;
            }

            const registerBtn = document.getElementById('register-school-btn');
            if (registerBtn) {
                registerBtn.style.display = 'flex';
                // Также показываем тултип
                const tooltip = document.querySelector('.register-tooltip');
                if (tooltip) tooltip.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    // Определяем текущую страницу
    const currentPage = document.body.getAttribute('data-page') || '';
    const userRole = localStorage.getItem('userRole');
    
    // Загружаем сайдбар
    SidebarLoader.loadSidebar(currentPage);
    
    // Фиксируем высоту сайдбара
    function fixSidebarHeight() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.height = `${window.innerHeight}px`;
        }
    }
    
    fixSidebarHeight();
    window.addEventListener('resize', fixSidebarHeight);

    const registerBtn = document.getElementById('register-school-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            SchoolRegistrationModal.open();
        });
    }

    if (['admin', 'moderator'].includes(userRole)) {
        NewsEditor.init();
        document.querySelectorAll('.news-item').forEach(item => {
            const actions = item.querySelector('.news-actions');
            if (actions) actions.style.display = 'flex';
        });
    }

    async function loadNews() {
        const container = document.getElementById('news-container');
        if (!container) return; 
        
        if (!document.getElementById('edit-news-modal')) {
            const modalResponse = await fetch('edit-news-modal.html');
            const modalHTML = await modalResponse.text();
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Сразу скрываем модальное окно
            const modal = document.getElementById('edit-news-modal');
            if (modal) modal.style.display = 'none';
        }

        fetch('news.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const container = document.getElementById('news-container');
                    const userRole = localStorage.getItem('userRole');
                    const showActions = ['admin', 'moderator'].includes(userRole);

                    container.innerHTML = data.news.map(news => `
                        <div class="news-item" data-id="${news.id}">
                            <div class="news-header">
                                <h3 class="news-title">${news.title}</h3>
                                ${showActions ? `
                                <div class="news-actions">
                                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                                    <button class="btn-delete"><i class="fas fa-trash"></i></button>
                                </div>
                                ` : ''}
                            </div>
                            <p>${news.content}</p>
                            <p class="news-date">
                                <i class="far fa-calendar-alt"></i>
                                ${new Date(news.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    `).join('');

                    // Инициализируем редактор новостей, если пользователь имеет права
                    if (showActions) {
                        NewsEditor.init();
                    }
                }
            })
            .catch(error => console.error('Ошибка загрузки новостей:', error));
    }

    loadNews();
});

