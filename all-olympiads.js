document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('olympiads-list');
  const filter = document.getElementById('status-filter');
  const limitSelect = document.getElementById('limit-select');
  const pagination = document.getElementById('pagination');
  const sortBtn = document.getElementById('sort-toggle');

  let olympiads = [];
  let currentPage = 1;
  let limit = parseInt(limitSelect.value);
  let currentSort = 'desc';

  // Обновляем статусы при входе и каждые 60 секунд
  await fetch('api/update-olympiad-statuses.php');
  setInterval(async () => {
    await fetch('api/update-olympiad-statuses.php');
    try {
      const res = await fetch('api/get-olympiads.php');
      olympiads = await res.json();
      renderPaginatedOlympiads();
    } catch (e) {
      console.error('Ошибка обновления списка олимпиад:', e);
    }
  }, 60000);

  try {
    const res = await fetch('api/get-olympiads.php');
    olympiads = await res.json();
    renderPaginatedOlympiads();
  } catch (e) {
    console.error(e);
    list.innerHTML = '<p class="error-message">Ошибка загрузки данных.</p>';
  }

  filter.addEventListener('change', () => {
    currentPage = 1;
    renderPaginatedOlympiads();
  });

  limitSelect.addEventListener('change', () => {
    limit = parseInt(limitSelect.value);
    currentPage = 1;
    renderPaginatedOlympiads();
  });

  sortBtn.addEventListener('click', () => {
    currentSort = currentSort === 'asc' ? 'desc' : 'asc';
    sortBtn.innerHTML = currentSort === 'asc'
      ? '<i class="fas fa-sort-amount-up-alt"></i> Сначала старые'
      : '<i class="fas fa-sort-amount-down-alt"></i> Сначала новые';
    renderPaginatedOlympiads();
  });

  function renderPaginatedOlympiads() {
    const value = filter.value;
    let filtered = value === 'all' ? olympiads : olympiads.filter(o => o.status === value);

    filtered.sort((a, b) => currentSort === 'asc'
      ? new Date(a.datetime) - new Date(b.datetime)
      : new Date(b.datetime) - new Date(a.datetime));

    const totalPages = Math.ceil(filtered.length / limit);
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    renderOlympiads(paginated);
    renderPagination(totalPages);
  }

  function renderOlympiads(data) {
    list.innerHTML = '';

    if (!data || data.length === 0) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Нет созданных олимпиад.</p></div>';
      return;
    }

    data.forEach(o => {
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
            </div>
            <span class="status-tag status-${o.status}">${mapStatus(o.status)}</span>
          </div>
          <div class="olympiad-arrow"><i class="fas fa-arrow-right"></i></div>
        </div>
      `;
      item.addEventListener('click', () => {
        window.location.href = `olympiad-detail.html?id=${o.id}&mode=organizer`;
      });
      list.appendChild(item);
    });
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn${i === currentPage ? ' active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderPaginatedOlympiads();
      });
      pagination.appendChild(btn);
    }
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
