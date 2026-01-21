document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('add-expert-modal');
  const openBtn = document.getElementById('add-expert-btn');
  const closeBtn = document.getElementById('close-add-expert-modal');
  const form = document.getElementById('add-expert-form');
  const checkbox = document.getElementById('same-organization-checkbox');
  const orgInput = document.getElementById('expert-organization');

  // Автоподстановка организации (если включено)
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      // заменить на реальную переменную, если она доступна в JS:
      orgInput.value = window.organizerOrganizationName || 'Организация организатора';
      orgInput.readOnly = true;
    } else {
      orgInput.readOnly = false;
      orgInput.value = '';
    }
  });

  // Открыть модалку
  openBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    document.body.classList.add('no-scroll');
  });

  // Закрыть модалку
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('no-scroll');
    form.reset();
    orgInput.disabled = false;
  });

  // Отправка формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append('olympiad_id', window.currentOlympiadId); // предполагается, что ID олимпиады передаётся глобально

    try {
      const res = await fetch('api/add-expert.php', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        alert(`Эксперт добавлен. Логин: ${data.login}, Пароль: ${data.password}`);
        modal.style.display = 'none';
        document.body.classList.remove('no-scroll');
        form.reset();
        orgInput.disabled = false;
        // TODO: обновить список экспертов в таблице
      } else {
        alert('Ошибка: ' + (data.error || 'Не удалось добавить эксперта.'));
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при отправке запроса.');
    }
  });
});
