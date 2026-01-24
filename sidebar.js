// sidebarLoader.js
import { AuthModal } from './auth-modal.js';

export class SidebarLoader {
    static async loadSidebar(currentPage = '') {
        try {
            // Загружаем HTML сайдбара
            const response = await fetch('sidebar.html');
            const sidebarHtml = await response.text();
            
            // Вставляем сайдбар в контейнер
            const sidebarContainer = document.createElement('div');
            sidebarContainer.innerHTML = sidebarHtml;
            document.querySelector('.container').prepend(sidebarContainer.firstElementChild);
            
            // Помечаем активную страницу
            if (currentPage) {
                const activeItem = document.querySelector(`.nav-menu li[data-page="${currentPage}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            }
            
            // Инициализируем обработчики событий
            this.initSidebarEvents();
            
        } catch (error) {
            console.error('Ошибка загрузки сайдбара:', error);
        }
    }
    
    static initSidebarEvents() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-btn');
        const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
        const mainContent = document.getElementById('main-content');
        const loginBtn = document.getElementById('login-btn');
        
        // Проверяем состояние сайдбара в localStorage
        const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            if (mainContent) mainContent.classList.add('collapsed');
        }

        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        AuthModal.updateAuthUI(isAuthenticated);
        
        // Обработчик кнопки входа
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                AuthModal.open();
            })
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                fetch('logout.php')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.clearLocalStorage) {
                            localStorage.removeItem('userRole');
                            AuthModal.updateAuthUI(false);
                            SidebarLoader.updateUserMenu(); // Обновляем меню

                            // Показываем кнопку регистрации школы после выхода
                            const registerBtn = document.getElementById('register-school-btn');
                            if (registerBtn) {
                                registerBtn.style.display = 'flex';
                                // Также показываем тултип
                                const tooltip = document.querySelector('.register-tooltip');
                                if (tooltip) tooltip.style.display = 'inline-block';
                            }
                            
                            window.location.href = 'index.html';
                            location.reload();
                        }
                    })
                    .catch(error => console.error('Ошибка при выходе:', error));
            });
        }
            
        // Обработчик кнопки сворачивания/разворачивания
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('collapsed');
                
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });
        }
        
        // Обработчик мобильной кнопки меню
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', function() {
                sidebar.classList.toggle('expanded');
            });
        }
        
        // Закрытие сайдбара при клике вне его на мобильных устройствах
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 992) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnMobileToggle = mobileToggleBtn && mobileToggleBtn.contains(event.target);
                
                if (!isClickInsideSidebar && !isClickOnMobileToggle && sidebar.classList.contains('expanded')) {
                    sidebar.classList.remove('expanded');
                }
            }
        });
        
        // Адаптация к изменению размера окна
        window.addEventListener('resize', function() {
            if (window.innerWidth > 992) {
                sidebar.classList.remove('expanded');
            }
        });

        this.updateUserMenu();
    }

    static updateUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (!userMenu) return;
        
        const menuItems = userMenu.querySelector('ul');
        menuItems.innerHTML = ''; // Всегда очищаем меню

        // Проверяем, авторизован ли пользователь и его роль
        const userRole = localStorage.getItem('userRole');
        
        if (userRole) {
            const dashboardHref = {
                admin: 'dashboard-admin.html',
                moderator: 'dashboard-admin.html',
                expert: 'dashboard-jury.html',
                organizer: 'dashboard-organizer.html',
            }[userRole] || 'index.html';

            if (['admin', 'moderator', 'organizer', 'expert'].includes(userRole)) {
                // Добавляем кнопку "Панель управления" для привилегированных ролей
                menuItems.innerHTML = `
                    <li data-page="dashboard">
                        <a href="${dashboardHref}">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Панель управления</span>
                        </a>
                    </li>
                `;
            } else if (userRole === 'student') {
                // Добавляем кнопку "Личный кабинет" для учеников
                menuItems.innerHTML = `
                    <li data-page="profile">
                        <a href="dashboard-student.html">
                            <i class="fas fa-user-circle"></i>
                            <span>Личный кабинет</span>
                        </a>
                    </li>
                `;
            }
        }
    }

    static setActiveItem(currentPage) {
        const activeItem = document.querySelector(`.nav-menu li[data-page="${currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

}
