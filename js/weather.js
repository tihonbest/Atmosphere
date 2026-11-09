(() => {
  const $ = id => document.getElementById(id);
  let fahrenheit = false, current = null;
  const url = place => 'https://wttr.in/' + encodeURIComponent(place) + '?format=j1';
  const text = value => Array.isArray(value) && value[0] ? value[0].value : (value || '');
  const condition = desc => {
    const s = String(desc || '').toLowerCase();
    if (/thunder/.test(s)) return ['Гроза', '⛈'];
    if (/snow|sleet|blizzard|ice/.test(s)) return ['Снег или гололёд', '🌨'];
    if (/rain|drizzle|shower/.test(s)) return ['Дождь', '🌧'];
    if (/fog|mist|haze/.test(s)) return ['Туман', '〰'];
    if (/overcast/.test(s)) return ['Пасмурно', '☁'];
    if (/cloud/.test(s)) return ['Облачно', '⛅'];
    if (/sun|clear/.test(s)) return ['Ясно', '☀'];
    return [desc || 'Переменная погода', '☁'];
  };
  const temp = c => Math.round(fahrenheit ? Number(c) * 9 / 5 + 32 : Number(c));
  const unit = () => fahrenheit ? '°F' : '°';
  function render(data, place) {
    const now = data.current_condition?.[0];
    const days = data.weather || [];
    if (!now || !days.length) throw Error('Сервис вернул неполный прогноз.');
    const [desc, icon] = condition(text(now.weatherDesc));
    $('location').textContent = place;
    $('temperature').textContent = temp(fahrenheit ? now.temp_F : now.temp_C) + unit();
    $('condition').textContent = desc;
    $('weather-icon').textContent = icon;
    $('feels').textContent = 'Ощущается как ' + temp(fahrenheit ? now.FeelsLikeF : now.FeelsLikeC) + unit();
    $('wind').textContent = Math.round(Number(now.windspeedKmph)) + ' км/ч';
    $('humidity').textContent = Math.round(Number(now.humidity)) + '%';
    const hourly = days[0].hourly || [];
    const hour = new Date().getHours();
    const index = Math.max(0, hourly.findIndex(x => Number(x.time) / 100 === hour));
    $('rain').textContent = Math.round(Number(hourly[index]?.chanceofrain || 0)) + '%';
    $('weather-summary').textContent = desc;
    $('sun-symbol').textContent = Number(now.isday) ? '☀' : '☾';
    $('updated').textContent = 'Обновлено в ' + (now.observation_time || 'сейчас');
    $('hourly').innerHTML = '';
    const slots = hourly.slice(index, index + 8);
    slots.forEach((item, i) => {
      const [label, symbol] = condition(text(item.weatherDesc));
      const el = document.createElement('div');
      el.className = 'hour' + (i === 0 ? ' now' : '');
      const time = document.createElement('time');
      time.textContent = i === 0 ? 'СЕЙЧАС' : String(Math.floor(Number(item.time) / 100)).padStart(2, '0') + ':00';
      const ico = document.createElement('span');
      ico.className = 'hour-icon'; ico.textContent = symbol; ico.title = label;
      const value = document.createElement('strong');
      value.textContent = temp(fahrenheit ? item.tempF : item.tempC) + unit();
      el.append(time, ico, value); $('hourly').append(el);
    });
    $('units-toggle').textContent = fahrenheit ? '°F' : '°C';
  }
  async function load(place) {
    $('condition').textContent = 'Обновляем прогноз…';
    const response = await fetch(url(place), { headers: { Accept: 'application/json' } });
    if (!response.ok) throw Error('Не удалось получить прогноз погоды.');
    const data = await response.json();
    current = { place, data };
    localStorage.setItem('atmosphere-location', JSON.stringify({ place }));
    render(data, place);
  }
  function showError(message) { $('dialog-error').textContent = message; }
  async function locate() {
    showError('');
    if (!navigator.geolocation) { showError('Геолокация не поддерживается браузером.'); return; }
    $('use-location').textContent = 'Определяем местоположение…';
    navigator.geolocation.getCurrentPosition(async p => {
      try {
        await load(p.coords.latitude + ',' + p.coords.longitude);
        $('location-dialog').close();
      } catch (e) { showError(e.message); }
      $('use-location').textContent = '◎ Использовать моё местоположение';
    }, () => {
      $('use-location').textContent = '◎ Использовать моё местоположение';
      showError('Не удалось определить местоположение. Введите город вручную.');
    }, { timeout: 10000, maximumAge: 600000 });
  }
  $('search-city').addEventListener('click', async () => {
    const city = $('city-input').value.trim();
    if (!city) { showError('Введите название города.'); return; }
    showError(''); $('search-city').textContent = 'Ищем…';
    try {
      await load(city);
      $('location-dialog').close();
      $('location').textContent = city;
    } catch (e) { showError('Не удалось найти город или загрузить погоду. Попробуйте другое название.'); }
    $('search-city').innerHTML = 'Найти город <span>→</span>';
  });
  $('city-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('search-city').click(); }
  });
  $('use-location').addEventListener('click', locate);
  $('change-location').addEventListener('click', () => {
    $('location-dialog').showModal(); $('city-input').focus();
  });
  $('units-toggle').addEventListener('click', () => {
    fahrenheit = !fahrenheit;
    if (current) render(current.data, current.place);
  });
  async function init() {
    const saved = localStorage.getItem('atmosphere-location');
    if (saved) {
      try {
        const place = JSON.parse(saved).place;
        if (place) { await load(place); return; }
      } catch (e) {}
    }
    $('location-dialog').showModal();
    $('condition').textContent = 'Выберите город';
    $('hourly').innerHTML = '<div class="loading-line">Укажите город или разрешите доступ к геолокации.</div>';
  }
  init();
  setInterval(() => {
    if (current) load(current.place).catch(() => {});
  }, 1800000);
})();