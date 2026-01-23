document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const mode = params.get('mode');
  const title = document.getElementById('olympiad-title');
  const editBtn = document.getElementById('edit-info-btn');
  const actions = document.getElementById('actions');
  const participantsSection = document.getElementById('participants-table')?.closest('.olympiad-section');
  const jurySection = document.getElementById('jury-block');
  let isOrganizer = false;
  const isOrganizerView = mode === 'organizer';

  if (!id) {
    title.textContent = 'Олимпиада не найдена';
    if (actions) {
      actions.style.display = 'none';
    }
    return;
  }

  async function fetchUserRole() {
    try {
      const res = await fetch('check-auth.php');
      const data = await res.json();
      if (res.ok && data.success) {
        return data.user_role || null;
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
    }
    return null;
  }

  async function fetchOlympiadDetails(olympiadId) {
    const res = await fetch(`api/get-olympiad.php?id=${olympiadId}`);
    const data = await res.json();
    if (res.ok && data && !data.error) {
      return data;
    }

    if (data && data.error === 'Unauthorized') {
      const publicRes = await fetch(`api/get-public-olympiad.php?id=${olympiadId}`);
      const publicData = await publicRes.json();
      if (publicRes.ok && publicData && !publicData.error) {
        return publicData;
      }
    }

    throw new Error((data && data.error) || 'Ошибка загрузки олимпиады');
  }

  try {
    const role = await fetchUserRole();
    isOrganizer = role === 'organizer';
    const olympiad = await fetchOlympiadDetails(id);

    if (olympiad && olympiad.title) {
      window.currentOlympiadId = olympiad.id;

      if (isOrganizer && isOrganizerView) {
        loadParticipants(id);
        loadJuryMembers(window.currentOlympiadId);
        if (actions) {
          actions.classList.remove('hidden');
        }
      } else if (actions) {
        actions.style.display = 'none';
        const participantsTable = document.getElementById('participants-table');
        if (participantsTable) {
          participantsTable.classList.add('public-view');
        }
      }
      title.textContent = `${olympiad.title} — ${olympiad.subject}`;
      window.currentOlympiadStatus = olympiad.status;

      // Скрыть кнопку редактирования, если статус не "ожидается"
      if (olympiad.status !== 'upcoming' || !isOrganizer || !isOrganizerView) {
        editBtn.style.display = 'none';
      }

      const infoBlock = document.getElementById('info-placeholder');
      const format = date => new Date(date).toLocaleString();
      const statusText = s => {
        switch (s) {
          case 'upcoming': return 'Ожидается';
          case 'ongoing': return 'В процессе';
          case 'completed': return 'Завершена';
          case 'cancelled': return 'Отменена';
          default: return 'Неизвестно';
        }
      };

      infoBlock.innerHTML = `
        <p><strong>Предмет:</strong> ${olympiad.subject}</p>
        <p><strong>Дата и время:</strong> ${format(olympiad.datetime)}</p>
        <p><strong>Классы:</strong> ${olympiad.grades}</p>
        <p><strong>Статус:</strong> ${statusText(olympiad.status)}</p>
        <p><strong>Описание:</strong><br>${olympiad.description || '—'}</p>
      `;
    } else {
      title.textContent = 'Олимпиада не найдена';
      if (actions) actions.style.display = 'none';
    }

  } catch (error) {
    console.error('Ошибка загрузки олимпиады:', error);
    title.textContent = 'Олимпиада не найдена';
    if (actions) {
      actions.style.display = 'none';
    }
  }

  document.getElementById('close-jury-modal').addEventListener('click', () => {
    document.getElementById('jury-modal').style.display = 'none';
    document.body.classList.remove('no-scroll');

    const bodyView = document.querySelector('#jury-modal .modal-body .mode-view');
    if (bodyView) bodyView.style.display = 'block';

    const bodyEdit = document.querySelector('#jury-modal .modal-body .mode-edit');
    if (bodyEdit) bodyEdit.style.display = 'none';

    const footerView = document.querySelector('#jury-modal .modal-footer .mode-view');
    if (footerView) footerView.style.display = 'block';
  });

  // Открытие модального окна
  document.getElementById('add-student-btn')?.addEventListener('click', () => {
    document.getElementById('add-student-form')?.reset();
    document.getElementById('add-student-modal')?.classList.add('open');
    document.body.classList.add('no-scroll');
  });

  // Закрытие модального окна
  document.getElementById('close-add-student')?.addEventListener('click', () => {
    document.getElementById('add-student-modal')?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  });

  // Отправка формы
  document.getElementById('add-student-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.olympiad_id = new URLSearchParams(window.location.search).get('id');

    try {
      const res = await fetch('api/add-student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        alert('Участник успешно добавлен');
        form.reset();
        document.getElementById('add-student-modal').classList.remove('open');
        document.body.classList.remove('no-scroll');
        if (window.currentOlympiadId) {
          loadParticipants(window.currentOlympiadId);
        }
      } else {
        alert('Ошибка: ' + (result.error || 'Не удалось добавить участника'));
      }
    } catch (err) {
      console.error('Ошибка при добавлении участника:', err);
      alert('Ошибка сервера');
    }
  });

  document.getElementById('close-participant-modal')?.addEventListener('click', () => {
    document.getElementById('participant-modal').classList.remove('open');
    document.body.classList.remove('no-scroll');
  });

  document.getElementById('print-jury-btn')?.addEventListener('click', () => {
  const full_name = document.getElementById('jury-full-name')?.textContent || '';
  const organization = document.getElementById('jury-organization')?.textContent || '';
  const role = document.getElementById('jury-role')?.textContent || '';
  const birthdate = document.getElementById('jury-birthdate')?.textContent || '';
  const passport_series = document.getElementById('jury-passport-series')?.textContent || '';
  const passport_number = document.getElementById('jury-passport-number')?.textContent || '';
  const issued_by = document.getElementById('jury-issued-by')?.textContent || '';
  const issued_date = document.getElementById('jury-issued-date')?.textContent || '';
  const olympiad_name = document.getElementById('olympiad-name')?.textContent || 'Название олимпиады';
  const olympiad_date = document.getElementById('olympiad-date')?.textContent || 'Дата проведения';
  const edu_org = document.getElementById('olympiad-org')?.textContent || 'Организатор';
  const login = document.getElementById('jury-login')?.textContent || 'логин';
  const password = document.getElementById('jury-password')?.textContent || 'пароль';

  const html = `
    <html>
    <head>
      <title>Карточка члена жюри</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" integrity="sha512-Z+z0Bd2Fl+F0w9eDbmiZ6wJKJgPQmp6kLe9EfbUWpz3DqQX1AkL1e95nXAXN9bItUcBhZoI2gztWcY4lcc3K1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: auto;
          border: 1px solid #004080;
          background-color: #fdfdfd;
          font-size: 13px;
          line-height: 1.3;
        }
        header {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #004080;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        header img {
          width: 50px;
          height: 50px;
          margin-right: 15px;
        }
        .platform-name {
          font-size: 18px;
          font-weight: bold;
          color: #004080;
        }
        .doc-title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
          margin-top: 5px;
          color: #222;
        }
        .section {
          margin-bottom: 6px;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          width: 230px;
          color: #003366;
        }
        .section-title {
          font-size: 15px;
          font-weight: bold;
          color: #004080;
          margin-top: 12px;
          margin-bottom: 5px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 2px;
        }
        .credentials {
          border-top: 1px dashed #004080;
          margin-top: 15px;
          padding-top: 10px;
          background-color: #eef4fb;
          padding: 10px;
        }
        .important {
          background: #fff4e5;
          border: 1px solid #f0c36d;
          padding: 6px;
          margin-top: 10px;
          color: #7c5200;
          font-size: 12px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          border-top: 1px solid #004080;
          padding-top: 10px;
          font-size: 11px;
          color: #555;
        }
        .footer img {
          width: 80px;
          height: 80px;
          border: 1px solid #ccc;
          background: #fff;
        }
        .note {
          font-style: italic;
          color: #555;
        }

      </style>
    </head>
    <body>
      <header style="display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #004080; padding-bottom: 10px; margin-bottom: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#004080" viewBox="0 0 576 512" style="flex-shrink: 0;">
          <path d="M552 64H504V24c0-13.25-10.75-24-24-24h-72c-13.25 0-24 10.75-24 24v40H192V24c0-13.25-10.75-24-24-24H96C82.75 0 72 10.75 72 24v40H24C10.75 64 0 74.75 0 88v56c0 66.25 49.63 120.8 113.3 127.2C136.5 328.4 192 371.8 256 383.2V432H176c-13.25 0-24 10.75-24 24v32h272v-32c0-13.25-10.75-24-24-24H320v-48.75c64-11.38 119.5-54.75 142.8-112C526.4 264.8 576 210.3 576 144V88C576 74.75 565.3 64 552 64zM64 144V96h32v112.3C78.75 199.3 64 174.5 64 144zM512 144c0 30.5-14.75 55.25-32 64.25V96h32V144z"/>
        </svg>
        <div class="platform-name" style="font-size: 18px; font-weight: bold; color: #004080;">
          Единая цифровая платформа школьных олимпиад
        </div>
      </header>


      <div class="doc-title">КАРТОЧКА ЧЛЕНА ЖЮРИ</div>

      <div class="section-title">Персональные данные</div>
      <div class="section"><span class="label">ФИО:</span> ${full_name}</div>
      <div class="section"><span class="label">Организация:</span> ${organization}</div>
      <div class="section"><span class="label">Роль:</span> ${role}</div>
      <div class="section"><span class="label">Дата рождения:</span> ${birthdate}</div>
      <div class="section"><span class="label">Паспортные данные:</span> серия ${passport_series}, номер ${passport_number}</div>
      <div class="section"><span class="label">Кем выдан:</span> ${issued_by}</div>
      <div class="section"><span class="label">Дата выдачи:</span> ${issued_date}</div>

      <div class="section-title">Данные олимпиады</div>
      <div class="section"><span class="label">Олимпиада:</span> ${olympiad_name}</div>
      <div class="section"><span class="label">Дата проведения:</span> ${olympiad_date}</div>
      <div class="section"><span class="label">Организатор:</span> ${edu_org}</div>

      <div class="section-title">Учетные данные</div>
      <div class="credentials">
        <div class="section"><span class="label">Логин:</span> ${login}</div>
        <div class="section"><span class="label">Пароль:</span> ${password}</div>
        <div class="important">
          Внимание: храните эти данные в безопасности. Не передавайте их третьим лицам.
        </div>
      </div>

      <div class="footer">
        <div>
          <div class="note">Если вы забыли пароль — отсканируйте QR-код для восстановления доступа.</div>
          <div class="note">Подробности на сайте платформы.</div>
        </div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://olympiad-platform.ru/recover" alt="QR для восстановления">
      </div>
    </body>
    </html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();

  // ⏳ ждём полной загрузки ресурсов (в т.ч. Font Awesome)
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };;
});

  
// Обработчик кнопки "Редактировать"
  document.getElementById('edit-jury-btn').addEventListener('click', () => {
    const bodyView = document.querySelector('#jury-modal .modal-body .mode-view');
    if (bodyView) bodyView.style.display = 'none';

    const bodyEdit = document.querySelector('#jury-modal .modal-body .mode-edit');
    if (bodyEdit) bodyEdit.style.display = 'block';

    const footerView = document.querySelector('#jury-modal .modal-footer .mode-view');
    if (footerView) footerView.style.display = 'none';

    // Заполнение input
    document.getElementById('jury-id-input').value = document.getElementById('jury-id-span').textContent;
    document.getElementById('jury-full-name-input').value = document.getElementById('jury-full-name').textContent;
    document.getElementById('jury-organization-input').value = document.getElementById('jury-organization').textContent;
    document.getElementById('jury-role-input').value = document.getElementById('jury-role').textContent;
    document.getElementById('jury-passport-series-input').value = document.getElementById('jury-passport-series').textContent;
    document.getElementById('jury-passport-number-input').value = document.getElementById('jury-passport-number').textContent;
    document.getElementById('jury-issued-by-input').value = document.getElementById('jury-issued-by').textContent;
    document.getElementById('jury-issued-date-input').value = document.getElementById('jury-issued-date').textContent;
    document.getElementById('jury-birthdate-input').value = document.getElementById('jury-birthdate').textContent;
  });


  // Обработчик сохранения формы редактирования жюри
  document.getElementById('edit-jury-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('jury_id', document.getElementById('jury-id-input').value);
    formData.append('full_name', document.getElementById('jury-full-name-input').value);
    formData.append('organization', document.getElementById('jury-organization-input').value);
    formData.append('jury_role', document.getElementById('jury-role-input').value);
    formData.append('passport_series', document.getElementById('jury-passport-series-input').value);
    formData.append('passport_number', document.getElementById('jury-passport-number-input').value);
    formData.append('passport_issued_by', document.getElementById('jury-issued-by-input').value);
    formData.append('passport_issued_date', document.getElementById('jury-issued-date-input').value);
    formData.append('birthdate', document.getElementById('jury-birthdate-input').value);
    formData.append('olympiad_id', window.currentOlympiadId); // глобально доступен

    try {
      const res = await fetch('api/update-jury-members.php', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (result.success) {
        // Обновим view
        document.getElementById('jury-full-name').textContent = document.getElementById('jury-full-name-input').value;
        document.getElementById('jury-organization').textContent = document.getElementById('jury-organization-input').value;
        document.getElementById('jury-role').textContent = document.getElementById('jury-role-input').value;
        document.getElementById('jury-passport-series').textContent = document.getElementById('jury-passport-series-input').value;
        document.getElementById('jury-passport-number').textContent = document.getElementById('jury-passport-number-input').value;
        document.getElementById('jury-issued-by').textContent = document.getElementById('jury-issued-by-input').value;
        document.getElementById('jury-issued-date').textContent = document.getElementById('jury-issued-date-input').value;
        document.getElementById('jury-birthdate').textContent = document.getElementById('jury-birthdate-input').value;
        
        const bodyView = document.querySelector('#jury-modal .modal-body .mode-view');
        if (bodyView) bodyView.style.display = 'block';

        const bodyEdit = document.querySelector('#jury-modal .modal-body .mode-edit');
        if (bodyEdit) bodyEdit.style.display = 'none';

        const footerView = document.querySelector('#jury-modal .modal-footer .mode-view');
        if (footerView) footerView.style.display = 'block';

        alert('Данные успешно обновлены!');
      } else {
        alert('Ошибка: ' + (result.error || 'Не удалось обновить.'));
      }
    } catch (err) {
      console.error('Ошибка запроса:', err);
      alert('Ошибка при отправке данных.');
    }
  });

});

async function loadParticipants(olympiadId) {
  try {
    const res = await fetch(`api/get-olympiad-participants.php?id=${olympiadId}`);
    const participants = await res.json();
    if (!res.ok || participants.error) {
      throw new Error(participants.error || 'Ошибка загрузки участников');
    }
    const table = document.getElementById('participants-table');
    const placeholder = document.getElementById('participants-placeholder');
    const tbody = table.querySelector('tbody');

    if (!participants.length) {
      placeholder.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    placeholder.style.display = 'none';
    table.style.display = 'table';
    tbody.innerHTML = '';

    participants.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.full_name}</td>
        <td>${p.grade}</td>
        <td>${p.score ?? '—'}</td>
        <td>
          ${p.work_file_id ? `<a href="get-file.php?id=${p.work_file_id}" target="_blank">Открыть</a>` : '—'}
        </td>
      `;
      row.addEventListener('click', () => openParticipantModal(p));
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Ошибка загрузки участников:', err);
  }
}

function openParticipantModal(p) {
  window.currentParticipant = p;

  const modal = document.getElementById('participant-modal');
  const view = document.getElementById('participant-view');
  const form = document.getElementById('edit-participant-form');

  // Переключаемся в режим просмотра
  document.querySelectorAll('.mode-view').forEach(el => el.style.display = '');
  document.querySelectorAll('.mode-edit').forEach(el => el.style.display = 'none');

  view.innerHTML = `
    <p><strong>ФИО:</strong> ${p.full_name}</p>
    <p><strong>Класс:</strong> ${p.grade}</p>
    <p><strong>Возраст:</strong> ${p.age ?? '—'}</p>
    <p><strong>СНИЛС:</strong> ${p.snils ?? '—'}</p>
    <p><strong>Email:</strong> ${p.email ?? '—'}</p>
  `;

  // Назначаем обработчик редактирования
  const editBtn = document.getElementById('edit-participant-btn');
  editBtn.onclick = () => {
    openEditParticipantForm(p);
  };

  modal.classList.add('open');
  document.body.classList.add('no-scroll');
}


document.getElementById('print-participant-btn')?.addEventListener('click', () => {
  const p = window.currentParticipant;
  if (!p) return alert('Нет данных участника');

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
    <head>
      <title>Карточка участника</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h2 { text-align: center; }
        p { margin: 10px 0; }
        .card { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h2>Карточка участника олимпиады</h2>
      <div class="card">
        <p><strong>ФИО:</strong> ${p.full_name}</p>
        <p><strong>Возраст:</strong> ${p.age ?? '—'}</p>
        <p><strong>Класс:</strong> ${p.grade}</p>
        <p><strong>Образовательное учреждение:</strong> ${p.school ?? '—'}</p>
        <p><strong>СНИЛС:</strong> ${p.snils ?? '—'}</p>
        <p><strong>Email:</strong> ${p.email ?? '—'}</p>
        <p><strong>Логин:</strong> ${p.login ?? '—'}</p>
        <p><strong>Пароль:</strong> ${p.password ?? '—'}</p>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
});

function openEditParticipantForm(p) {
  // Переключаемся в режим редактирования
  document.querySelectorAll('.mode-view').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.mode-edit').forEach(el => el.style.display = '');

  const form = document.getElementById('edit-participant-form');
  form.innerHTML = `
    <label>ФИО
      <input type="text" name="full_name" value="${p.full_name}" required />
    </label>
    <label>Возраст
      <input type="number" name="age" value="${p.age ?? ''}" min="6" max="25" />
    </label>
    <label>Класс
      <input type="number" name="grade" value="${p.grade}" min="1" max="11" />
    </label>
    <label>СНИЛС
      <input type="text" name="snils" value="${p.snils ?? ''}" pattern="\\d{11}" />
    </label>
    <label>Email
      <input type="email" name="email" value="${p.email ?? ''}" />
    </label>
    <button type="submit" class="btn-submit">Сохранить</button>
  `;

  setupParticipantEditHandler(p.id);
}


function setupParticipantEditHandler(participantId) {
  const form = document.getElementById('edit-participant-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Форма отправлена');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.id = participantId;

    try {
      const res = await fetch('api/update-participant.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        alert('Данные успешно обновлены');
        document.getElementById('participant-modal').classList.remove('open');
        document.body.classList.remove('no-scroll');
        loadParticipants(new URLSearchParams(location.search).get('id'));
      } else {
        alert('Ошибка: ' + result.error);
      }
    } catch (err) {
      console.error('Ошибка при обновлении участника:', err);
      alert('Ошибка сервера');
    }
  });
}

async function loadJuryMembers(olympiadId) {
  try {
    const res = await fetch(`api/get-jury-members.php?id=${olympiadId}`);
    const jury = await res.json();

    const tableBody = document.getElementById('jury-list-body');
    const placeholder = document.getElementById('jury-placeholder');
    const table = document.getElementById('jury-table');

    tableBody.innerHTML = '';

    if (jury.length === 0) {
      placeholder.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    placeholder.style.display = 'none';
    table.style.display = 'table';

    jury.forEach(member => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${member.full_name}</td>
        <td>${member.jury_role}</td>
      `;
      tr.addEventListener('click', () => openJuryModal(member));
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Ошибка загрузки экспертов:', err);
  }
}

function openJuryModal(member) {
  document.getElementById('jury-modal').style.display = 'flex';
  document.body.classList.add('no-scroll');

  document.getElementById('jury-id-span').textContent = member.jury_member_id;
  document.getElementById('jury-full-name').textContent = member.full_name;
  document.getElementById('jury-role').textContent = member.jury_role;
  document.getElementById('jury-organization').textContent = member.organization;
  document.getElementById('jury-passport-series').textContent = member.passport_series;
  document.getElementById('jury-passport-number').textContent = member.passport_number;
  document.getElementById('jury-issued-by').textContent = member.passport_issued_by;
  document.getElementById('jury-issued-date').textContent = member.passport_issued_date;
  document.getElementById('jury-birthdate').textContent = member.birthdate;

  const bodyEdit = document.querySelector('#jury-modal .modal-body .mode-edit');
  if (bodyEdit) bodyEdit.style.display = 'none';

  const bodyView = document.querySelector('#jury-modal .modal-body .mode-view');
  if (bodyView) bodyView.style.display = 'block';


  const footerModeEdit = document.querySelector('#jury-modal .modal-footer .mode-edit');
  const footerModeView = document.querySelector('#jury-modal .modal-footer .mode-view');

  if (footerModeEdit && footerModeView) {
    footerModeEdit.style.display = 'none';
    footerModeView.style.display = 'block';
  }

}
