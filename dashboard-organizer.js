document.addEventListener('DOMContentLoaded', async () => {
  const welcome = document.getElementById('welcome-message');
  try {
    const res = await fetch('api/get-user-info.php');
    const user = await res.json();
    if (user.full_name) {
      welcome.innerHTML = `<div class="welcome-box">
        <i class="fas fa-user-circle"></i>
        <span>Добро пожаловать, <strong>${user.full_name}</strong>!</span>
      </div>`;
    }
  } catch (e) {
    console.warn('Ошибка загрузки имени пользователя');
  }


  // Обновляем статусы олимпиад при входе
  await fetch('api/update-olympiad-statuses.php');

  // Обновляем статусы и статистику каждые 60 секунд
  setInterval(async () => {
    await fetch('api/update-olympiad-statuses.php');
    try {
      const res = await fetch('api/get-dashboard-stats.php');
      const text = await res.text();
      console.log('Автообновление статистики:', text);
      const stats = JSON.parse(text);
      if (!stats.error) {
        document.getElementById('active-count').textContent = stats.active;
        document.getElementById('completed-count').textContent = stats.completed;
        document.getElementById('students-count').textContent = stats.students;
      }
    } catch (e) {
      console.error('Ошибка автообновления статистики', e);
    }
  }, 60000);

  document.getElementById('view-olympiads')?.addEventListener('click', () => {
    window.location.href = 'all-olympiads.html';
  });

  try {
    const res = await fetch('api/get-dashboard-stats.php');
    const text = await res.text();
    console.log('Ответ от сервера:', text);
    const stats = JSON.parse(text);
    if (!stats.error) {
      document.getElementById('active-count').textContent = stats.active;
      document.getElementById('completed-count').textContent = stats.completed;
      document.getElementById('students-count').textContent = stats.students;
    }
  } catch (e) {
    console.error('Ошибка загрузки статистики', e);
  }

  const modal = document.getElementById('olympiad-modal');
  const form = document.getElementById('olympiad-form');

  document.getElementById('create-olympiad')?.addEventListener('click', () => {
    form?.reset();
    const datetimeInput = form.querySelector('input[name="datetime"]');
    if (datetimeInput) {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      const tomorrow = now.toISOString().slice(0, 16);
      datetimeInput.min = tomorrow;
    }
    modal?.classList.add('open');
    document.body.classList.add('no-scroll');
  });

  document.getElementById('modal-close')?.addEventListener('click', () => {
    if (form) {
      const hasData = Array.from(form.elements).some(el => el.value && el.type !== 'submit');
      if (hasData && !confirm('Вы уверены, что хотите закрыть форму? Данные будут потеряны.')) return;
    }
    modal?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      if (form) {
        const hasData = Array.from(form.elements).some(el => el.value && el.type !== 'submit');
        if (hasData && !confirm('Вы уверены, что хотите закрыть форму? Данные будут потеряны.')) return;
      }
      modal.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('api/create-olympiad.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert('Олимпиада успешно создана');
        modal?.classList.remove('open');
        document.body.classList.remove('no-scroll');
        form.reset();
        const activeCount = document.getElementById('active-count');
        if (activeCount) {
          const current = parseInt(activeCount.textContent) || 0;
          activeCount.textContent = current + 1;
        }
      } else {
        alert('Ошибка: ' + (data.error || 'Не удалось создать олимпиаду'));
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при создании олимпиады');
    }
  });
});