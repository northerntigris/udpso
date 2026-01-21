document.addEventListener('DOMContentLoaded', () => {
  const regionSelect = document.getElementById('region-select');
  const regionToggle = document.getElementById('region-toggle');
  const regionSearch = document.getElementById('region-search');
  const regionOptions = document.getElementById('region-options');
  const olympiadList = document.getElementById('olympiad-list');
  const emptyState = document.getElementById('olympiad-empty');

  if (!regionSelect || !regionToggle || !regionSearch || !regionOptions || !olympiadList) {
    return;
  }

  let currentRegion = 'all';

  const regions = [
    'Все регионы',
    'Республика Адыгея',
    'Республика Алтай',
    'Республика Башкортостан',
    'Республика Бурятия',
    'Республика Дагестан',
    'Республика Ингушетия',
    'Кабардино-Балкарская Республика',
    'Республика Калмыкия',
    'Карачаево-Черкесская Республика',
    'Республика Карелия',
    'Республика Коми',
    'Республика Крым',
    'Республика Марий Эл',
    'Республика Мордовия',
    'Республика Саха (Якутия)',
    'Республика Северная Осетия — Алания',
    'Республика Татарстан',
    'Республика Тыва',
    'Удмуртская Республика',
    'Республика Хакасия',
    'Чеченская Республика',
    'Чувашская Республика',
    'Алтайский край',
    'Забайкальский край',
    'Камчатский край',
    'Краснодарский край',
    'Красноярский край',
    'Пермский край',
    'Приморский край',
    'Ставропольский край',
    'Хабаровский край',
    'Амурская область',
    'Архангельская область',
    'Астраханская область',
    'Белгородская область',
    'Брянская область',
    'Владимирская область',
    'Волгоградская область',
    'Вологодская область',
    'Воронежская область',
    'Ивановская область',
    'Иркутская область',
    'Калининградская область',
    'Калужская область',
    'Кемеровская область — Кузбасс',
    'Кировская область',
    'Костромская область',
    'Курганская область',
    'Курская область',
    'Ленинградская область',
    'Липецкая область',
    'Магаданская область',
    'Московская область',
    'Мурманская область',
    'Нижегородская область',
    'Новгородская область',
    'Новосибирская область',
    'Омская область',
    'Оренбургская область',
    'Орловская область',
    'Пензенская область',
    'Псковская область',
    'Ростовская область',
    'Рязанская область',
    'Самарская область',
    'Саратовская область',
    'Сахалинская область',
    'Свердловская область',
    'Смоленская область',
    'Тамбовская область',
    'Тверская область',
    'Томская область',
    'Тульская область',
    'Тюменская область',
    'Ульяновская область',
    'Челябинская область',
    'Ярославская область',
    'Москва',
    'Санкт-Петербург',
    'Севастополь',
    'Еврейская автономная область',
    'Ненецкий автономный округ',
    'Ханты-Мансийский автономный округ — Югра',
    'Чукотский автономный округ',
    'Ямало-Ненецкий автономный округ',
    'Донецкая Народная Республика',
    'Луганская Народная Республика',
    'Запорожская область',
    'Херсонская область'
  ];

  function renderRegionOptions(filterText = '') {
    const normalizedFilter = filterText.trim().toLowerCase();
    const options = regions.filter(region => {
      if (!normalizedFilter) return true;
      return region.toLowerCase().includes(normalizedFilter);
    });

    regionOptions.innerHTML = '';
    options.forEach(region => {
      const li = document.createElement('li');
      li.className = 'region-select__option';
      li.dataset.value = region === 'Все регионы' ? 'all' : region;
      li.textContent = region;
      if (currentRegion === li.dataset.value) {
        li.classList.add('active');
      }
      li.addEventListener('click', () => {
        currentRegion = li.dataset.value;
        regionToggle.innerHTML = `${region}<i class="fas fa-chevron-down"></i>`;
        regionSelect.classList.remove('open');
        regionSearch.value = '';
        renderRegionOptions();
        filterOlympiads();
      });
      regionOptions.appendChild(li);
    });
  }

  function filterOlympiads() {
    const cards = Array.from(olympiadList.querySelectorAll('.olympiad-card'));
    let visibleCount = 0;

    cards.forEach(card => {
      const region = card.dataset.region || '';
      const isVisible = currentRegion === 'all' || region === currentRegion;
      card.classList.toggle('hidden', !isVisible);
      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('hidden', visibleCount > 0);
    }
  }

  regionToggle.addEventListener('click', () => {
    regionSelect.classList.toggle('open');
    if (regionSelect.classList.contains('open')) {
      regionSearch.focus();
    }
  });

  regionSearch.addEventListener('input', (event) => {
    renderRegionOptions(event.target.value);
  });

  document.addEventListener('click', (event) => {
    if (!regionSelect.contains(event.target)) {
      regionSelect.classList.remove('open');
    }
  });

  renderRegionOptions();
  filterOlympiads();
});
