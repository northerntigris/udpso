document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('jury-olympiads-list');
  if (!list) return;

  try {
    const res = await fetch('api/get-jury-olympiads.php');
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Ошибка загрузки данных');
    }

    const olympiads = data.olympiads || [];
    list.innerHTML = '';

    if (!olympiads.length) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Олимпиад пока нет.</p></div>';
      return;
    }

    olympiads.forEach(o => {
      const item = document.createElement('li');
      item.className = `olympiad-row card-${o.status}`;
      item.innerHTML = `
        <div class="olympiad-row-content">
          <div>
            <div class="olympiad-title"><i class="fas fa-trophy"></i> ${o.title}</div>
            <div class="olympiad-meta">
              <span><i class="fas fa-book"></i> ${o.subject}</span>
              <span><i class="fas fa-calendar-alt"></i> ${new Date(o.datetime).toLocaleString()}</span>
              <span><i class="fas fa-user-graduate"></i> ${o.grades}</span>
              <span><i class="fas fa-user-tag"></i> ${o.jury_role}</span>
            </div>
            <span class="status-tag status-${o.status}">${mapStatus(o.status)}</span>
          </div>
          <div class="olympiad-arrow"><i class="fas fa-arrow-right"></i></div>
        </div>
      `;
      item.addEventListener('click', () => {
        window.location.href = `olympiad-detail.html?id=${o.id}&mode=jury`;
      });
      list.appendChild(item);
    });
  } catch (error) {
    console.error('Ошибка загрузки олимпиад жюри:', error);
    list.innerHTML = '<p class="error-message">Ошибка загрузки данных.</p>';
  }

  function mapStatus(status) {
    switch (status) {
      case 'upcoming': return 'Ожидается';
      case 'ongoing': return 'В процессе';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
      default: return 'Неизвестно';
    }
  }
});
