document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('api/get-student-olympiads.php');
    const data = await res.json();

    const greetingEl = document.getElementById('greeting');
    if (greetingEl && data.name) {
      greetingEl.textContent = `Добро пожаловать, ${data.name}!`;
    }

    const getTrophyIcon = (place) => {
        if (!place) return '';
        let color = '#bdc3c7'; // обычный
        if (place === 1) color = '#f1c40f'; // золото
        else if (place === 2) color = '#c0c0c0'; // серебро
        else if (place === 3) color = '#cd7f32'; // бронза

        return `<i class="fas fa-trophy" style="color: ${color}; margin-left: 6px;" title="Место: ${place}"></i>`;
    };

    const renderStatus = (status) => {
        const map = {
            'upcoming': { text: 'Ожидается', class: 'status status-upcoming' },
            'ongoing': { text: 'В процессе', class: 'status status-ongoing' },
            'completed': { text: 'Завершена', class: 'status status-completed' },
            'cancelled': { text: 'Отменена', class: 'status status-cancelled' }
        };
        const s = map[status] || { text: status, class: 'status' };
        return `<span class="status-tag ${s.class}">${s.text}</span>`;
    };

    const body = document.getElementById('student-olympiads-body');
    data.olympiads.forEach(o => {
      const taskLink = o.task_file_id
        ? '<a href="get-file.php?id=' + o.task_file_id + '"><i class="fas fa-download"></i> Скачать</a>'
        : '-';

      const workLink = o.work_file_id
        ? '<a href="get-file.php?id=' + o.task_file_id + '"><i class="fas fa-download"></i> Скачать</a>'
        : '-';

        const scoreCell = (o.score !== null)
        ? `${o.score} ${getTrophyIcon(o.place)}`
        : '-';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${o.title}</td>
        <td>${o.subject}</td>
        <td>${o.datetime}</td>
        <td>${renderStatus(o.status)}</td>
        <td>${scoreCell}</td>
        <td>${taskLink}</td>
        <td>${workLink}</td>
      `;
      body.appendChild(row);
    });
  } catch (error) {
    console.error('Ошибка загрузки олимпиад:', error);
  }
});
