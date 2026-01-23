document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('add-expert-modal');
  const openBtn = document.getElementById('add-expert-btn');
  const closeBtn = document.getElementById('close-add-expert-modal');
  const form = document.getElementById('add-expert-form');
  const checkbox = document.getElementById('same-organization-checkbox');
  const orgInput = document.getElementById('expert-organization');

  if (!modal || !form || !checkbox || !orgInput) {
    return;
  }

  let organizerOrganization = null;

  async function loadOrganizerOrganization() {
    if (organizerOrganization) {
      return organizerOrganization;
    }

    try {
      const res = await fetch('api/get-organizer-organization.php');
      const data = await res.json();
      if (res.ok && data.success) {
        organizerOrganization = data.organization;
        return organizerOrganization;
      }
    } catch (error) {
      console.error('Ошибка загрузки организации организатора:', error);
    }

    return null;
  }

  // Автоподстановка организации (если включено)
  checkbox.addEventListener('change', async () => {
    if (checkbox.checked) {
      const organization = await loadOrganizerOrganization();
      orgInput.value = organization || '';
      orgInput.readOnly = true;
    } else {
      orgInput.readOnly = false;
      orgInput.value = '';
    }
  });

  // Открыть модалку
  openBtn?.addEventListener('click', () => {
    modal.style.display = 'flex';
    document.body.classList.add('no-scroll');
  });

  // Закрыть модалку
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('no-scroll');
    form.reset();
    orgInput.readOnly = false;
  });

  // Отправка формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

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
        orgInput.readOnly = false;
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
