const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const ACCESS_STATS_ENDPOINT = "https://busuanzi.ibruce.info/busuanzi";
const ACCESS_STATS_TIMEOUT_MS = 6000;
const DEFAULT_CITY = "Beijing";
const VALID_UNITS = new Set(["celsius", "fahrenheit"]);

const POPULAR_CITIES = [
  "Beijing",
  "Shanghai",
  "Guangzhou",
  "Shenzhen",
  "Chengdu",
  "Xi'an",
  "Hangzhou",
  "Nanjing",
  "Wuhan",
  "Chongqing",
];

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "weather_code",
  "wind_speed_10m",
];

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "wind_speed_10m_max",
];

const ACCESS_STATS_FIELDS = [
  ["site_pv", "#busuanzi_value_site_pv"],
  ["site_uv", "#busuanzi_value_site_uv"],
  ["page_pv", "#busuanzi_value_page_pv"],
];

const FEATURE_PRIORITY = {
  PPLC: 0,
  PPLA: 1,
  PPLA2: 2,
  PPLA3: 3,
  PPLA4: 4,
  PPL: 5,
};

const state = {
  unit: "celsius",
  selectedCity: null,
  requestId: 0,
};

const dom = {
  form: document.querySelector("#searchForm"),
  input: document.querySelector("#cityInput"),
  quickCities: document.querySelector("#quickCities"),
  statusLine: document.querySelector("#statusLine"),
  resultsPanel: document.querySelector("#resultsPanel"),
  cityResults: document.querySelector("#cityResults"),
  weatherBoard: document.querySelector("#weatherBoard"),
  currentIcon: document.querySelector("#currentIcon"),
  weatherLabel: document.querySelector("#weatherLabel"),
  weatherTitle: document.querySelector("#weatherTitle"),
  placeLine: document.querySelector("#placeLine"),
  currentTemp: document.querySelector("#currentTemp"),
  conditionLine: document.querySelector("#conditionLine"),
  feelsLike: document.querySelector("#feelsLike"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind"),
  updatedAt: document.querySelector("#updatedAt"),
  forecastGrid: document.querySelector("#forecastGrid"),
  unitButtons: Array.from(document.querySelectorAll(".unit-button")),
  trafficStats: document.querySelector(".traffic-stats"),
  accessStats: ACCESS_STATS_FIELDS.map(([key, selector]) => ({
    key,
    element: document.querySelector(selector),
  })),
};

const ICONS = {
  sun: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="12"></circle>
      <path d="M32 7v8M32 49v8M7 32h8M49 32h8M14.3 14.3l5.7 5.7M44 44l5.7 5.7M49.7 14.3 44 20M20 44l-5.7 5.7"></path>
    </svg>
  `,
  cloudSun: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="22" cy="22" r="9"></circle>
      <path d="M22 6v5M22 33v5M6 22h5M33 22h5M10.6 10.6l3.6 3.6M29.8 29.8l3.6 3.6M33.4 10.6l-3.6 3.6M14.2 29.8l-3.6 3.6"></path>
      <path d="M22 47h25a10 10 0 0 0 0-20 15 15 0 0 0-28.5 5.7A7.5 7.5 0 0 0 22 47Z"></path>
    </svg>
  `,
  cloud: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M19 49h28a11 11 0 0 0 0-22 16 16 0 0 0-30.5 6.1A8.5 8.5 0 0 0 19 49Z"></path>
    </svg>
  `,
  fog: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M20 36h27a9 9 0 0 0 0-18 14 14 0 0 0-26.7 5.5A7.5 7.5 0 0 0 20 36Z"></path>
      <path d="M12 45h40M16 53h32"></path>
    </svg>
  `,
  rain: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M19 36h28a10 10 0 0 0 0-20 15 15 0 0 0-28.7 5.8A8 8 0 0 0 19 36Z"></path>
      <path d="m22 45-3 7M34 45l-3 7M46 45l-3 7"></path>
    </svg>
  `,
  snow: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M19 35h28a10 10 0 0 0 0-20 15 15 0 0 0-28.7 5.8A8 8 0 0 0 19 35Z"></path>
      <path d="M24 48h0M34 52h0M45 47h0"></path>
    </svg>
  `,
  storm: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M19 34h28a10 10 0 0 0 0-20 15 15 0 0 0-28.7 5.8A8 8 0 0 0 19 34Z"></path>
      <path d="m34 38-8 13h9l-5 8 13-15h-9l5-6Z"></path>
    </svg>
  `,
};

function init() {
  hydrateInitialState();
  renderPopularCities();
  loadAccessStats();
  bindEvents();
  registerAgentTools();

  const cityName = initialCityName();
  dom.input.value = cityName === DEFAULT_CITY ? "" : cityName;
  searchCities(cityName, { hideResults: true, source: "initial", syncUrl: false });
}

function bindEvents() {
  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    searchCities(dom.input.value);
  });

  dom.unitButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setUnit(button.dataset.unit);
    });
  });
}

function renderPopularCities() {
  dom.quickCities.replaceChildren();

  POPULAR_CITIES.forEach((cityName) => {
    const button = document.createElement("button");
    button.className = "city-chip";
    button.type = "button";
    button.textContent = cityName;
    button.addEventListener("click", () => {
      dom.input.value = cityName;
      searchCities(cityName);
    });
    dom.quickCities.append(button);
  });
}

function loadAccessStats() {
  const callbackName = `__chinaWeatherTraffic_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const script = document.createElement("script");
  let settled = false;

  dom.trafficStats?.setAttribute("aria-busy", "true");

  const cleanup = () => {
    window.clearTimeout(timeoutId);
    script.remove();
    try {
      delete window[callbackName];
    } catch (error) {
      window[callbackName] = undefined;
    }
  };

  const fail = () => {
    if (settled) {
      return;
    }

    settled = true;
    renderAccessStats(null);
    cleanup();
  };

  window[callbackName] = (payload) => {
    if (settled) {
      return;
    }

    settled = true;
    renderAccessStats(payload);
    cleanup();
  };

  const timeoutId = window.setTimeout(fail, ACCESS_STATS_TIMEOUT_MS);

  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = `${ACCESS_STATS_ENDPOINT}?jsonpCallback=${encodeURIComponent(callbackName)}`;
  script.addEventListener("error", fail);
  document.head.append(script);
}

function renderAccessStats(payload) {
  dom.trafficStats?.setAttribute("aria-busy", "false");

  dom.accessStats.forEach(({ key, element }) => {
    if (!element) {
      return;
    }

    element.textContent = formatAccessStat(payload?.[key]);
  });
}

function formatAccessStat(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US").format(number);
}

async function searchCities(rawQuery, options = {}) {
  const query = String(rawQuery || "").trim();

  if (!query) {
    showStatus("Enter a city name to search China.", "warning");
    dom.resultsPanel.hidden = true;
    return;
  }

  const requestId = nextRequest();
  showStatus("Looking up cities in China...", "info");

  try {
    const cities = await fetchCityMatches(query, 8);

    if (requestId !== state.requestId) {
      return;
    }

    if (!cities.length) {
      dom.resultsPanel.hidden = true;
      dom.weatherBoard.hidden = true;
      showStatus("No Chinese city matched that search.", "warning");
      return;
    }

    if (!options.hideResults) {
      renderCityResults(cities);
    } else {
      dom.resultsPanel.hidden = true;
    }

    await selectCity(cities[0], {
      keepResults: !options.hideResults,
      source: options.source,
      syncUrl: options.syncUrl,
    });
  } catch (error) {
    if (requestId === state.requestId) {
      handleNetworkError(error, "City search is unavailable right now.");
    }
  }
}

function sortCities(cities) {
  return cities
    .filter((city) => city.country_code === "CN" && city.latitude && city.longitude)
    .sort((a, b) => {
      const rankA = FEATURE_PRIORITY[a.feature_code] ?? 9;
      const rankB = FEATURE_PRIORITY[b.feature_code] ?? 9;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return (b.population || 0) - (a.population || 0);
    });
}

function renderCityResults(cities) {
  dom.cityResults.replaceChildren();
  dom.resultsPanel.hidden = false;

  cities.forEach((city) => {
    const button = document.createElement("button");
    button.className = "result-button";
    button.type = "button";
    button.dataset.cityId = cityKey(city);

    const name = document.createElement("span");
    name.className = "result-name";
    name.textContent = city.name;

    const meta = document.createElement("span");
    meta.className = "result-meta";
    meta.textContent = formatLocation(city);

    const detail = document.createElement("span");
    detail.className = "result-detail";
    detail.textContent = formatCityDetail(city);

    button.append(name, meta, detail);
    button.addEventListener("click", () => selectCity(city, { keepResults: true }));
    dom.cityResults.append(button);
  });
}

async function selectCity(city, options = {}) {
  state.selectedCity = city;
  markSelectedCity(city);
  if (options.syncUrl !== false) {
    syncUrl(city);
  }
  await fetchWeather(city, options);
}

async function fetchWeather(city, options = {}) {
  const requestId = nextRequest();
  showStatus(`Loading forecast for ${city.name}...`, "info");

  try {
    const data = await fetchForecastData(city, state.unit);

    if (requestId !== state.requestId) {
      return;
    }

    validateForecastPayload(data);
    renderWeather(city, data);

    if (!options.keepResults) {
      dom.resultsPanel.hidden = true;
    }

    showStatus(`Showing ${city.name} weather in ${unitName()}.`, "success");
  } catch (error) {
    if (requestId === state.requestId) {
      handleNetworkError(error, "Weather forecast is unavailable right now.");
    }
  }
}

function validateForecastPayload(data) {
  if (!data || !data.current || !data.daily || !Array.isArray(data.daily.time)) {
    throw new Error("Open-Meteo returned an incomplete forecast.");
  }
}

function renderWeather(city, data) {
  const current = data.current;
  const weather = weatherInfo(current.weather_code);

  dom.weatherBoard.hidden = false;
  dom.currentIcon.innerHTML = iconMarkup(weather.icon);
  dom.weatherLabel.textContent = "Current weather";
  dom.weatherTitle.textContent = city.name;
  dom.placeLine.textContent = `${formatLocation(city)} | ${data.timezone || city.timezone || "Local time"}`;
  dom.currentTemp.textContent = formatTemp(current.temperature_2m);
  dom.conditionLine.textContent = weather.label;
  dom.feelsLike.textContent = formatTemp(current.apparent_temperature);
  dom.humidity.textContent = formatPercent(current.relative_humidity_2m);
  dom.wind.textContent = formatWind(current.wind_speed_10m);
  dom.updatedAt.textContent = `${formatDateTime(current.time)} local`;

  renderForecast(data.daily);
}

function renderForecast(daily) {
  dom.forecastGrid.replaceChildren();

  daily.time.forEach((date, index) => {
    const code = valueAt(daily.weather_code, index);
    const weather = weatherInfo(code);
    const day = document.createElement("article");
    day.className = "forecast-day";

    const name = document.createElement("div");
    name.className = "day-name";
    name.textContent = index === 0 ? "Today" : formatDay(date);

    const icon = document.createElement("div");
    icon.className = "day-icon";
    icon.innerHTML = iconMarkup(weather.icon);

    const temp = document.createElement("div");
    temp.className = "day-temp";
    const high = document.createElement("span");
    high.className = "high";
    high.textContent = formatTemp(valueAt(daily.temperature_2m_max, index));
    const low = document.createElement("span");
    low.className = "low";
    low.textContent = formatTemp(valueAt(daily.temperature_2m_min, index));
    temp.append(high, low);

    const detail = document.createElement("div");
    detail.className = "day-detail";
    const condition = document.createElement("span");
    condition.textContent = weather.label;
    const rain = document.createElement("span");
    rain.textContent = `Rain ${formatPercent(valueAt(daily.precipitation_probability_max, index))}`;
    const wind = document.createElement("span");
    wind.textContent = `Wind ${formatWind(valueAt(daily.wind_speed_10m_max, index))}`;
    detail.append(condition, rain, wind);

    day.append(name, icon, temp, detail);
    dom.forecastGrid.append(day);
  });
}

function setUnit(unit) {
  if (!unit || unit === state.unit) {
    return;
  }

  state.unit = unit;
  updateUnitButtons();

  if (state.selectedCity) {
    syncUrl(state.selectedCity);
    fetchWeather(state.selectedCity, { keepResults: !dom.resultsPanel.hidden });
  }
}

function hydrateInitialState() {
  const params = new URLSearchParams(window.location.search);
  const unit = params.get("unit");

  if (VALID_UNITS.has(unit)) {
    state.unit = unit;
  }

  updateUnitButtons();
}

function initialCityName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("city")?.trim() || DEFAULT_CITY;
}

function updateUnitButtons() {
  dom.unitButtons.forEach((button) => {
    const isActive = button.dataset.unit === state.unit;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncUrl(city) {
  const url = new URL(window.location.href);
  url.searchParams.set("city", city.name);
  url.searchParams.set("unit", state.unit);
  window.history.replaceState({}, "", url);
}

function markSelectedCity(city) {
  const key = cityKey(city);
  dom.cityResults.querySelectorAll(".result-button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.cityId === key);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.json();
}

async function fetchCityMatches(query, count) {
  const params = new URLSearchParams({
    name: query,
    count: String(count),
    language: "en",
    countryCode: "CN",
  });
  const data = await fetchJson(`${GEOCODING_ENDPOINT}?${params.toString()}`);

  return sortCities(data.results || []);
}

async function fetchForecastData(city, unit) {
  const params = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    current: CURRENT_FIELDS.join(","),
    daily: DAILY_FIELDS.join(","),
    forecast_days: "7",
    timezone: "auto",
    temperature_unit: unit,
    wind_speed_unit: "kmh",
  });

  return fetchJson(`${FORECAST_ENDPOINT}?${params.toString()}`);
}

async function getWeatherForAgent(cityName, unit = state.unit) {
  const query = String(cityName || "").trim();
  const requestedUnit = VALID_UNITS.has(unit) ? unit : "celsius";

  if (!query) {
    throw new Error("city is required");
  }

  const cities = await fetchCityMatches(query, 5);
  const city = cities[0];

  if (!city) {
    return {
      found: false,
      query,
      message: "No Chinese city matched that search.",
      matches: [],
    };
  }

  const forecast = await fetchForecastData(city, requestedUnit);
  validateForecastPayload(forecast);

  return formatAgentWeather(city, forecast, requestedUnit, cities);
}

function formatAgentWeather(city, forecast, unit, matches) {
  return {
    found: true,
    source: "Open-Meteo",
    unit,
    city: {
      name: city.name,
      admin1: city.admin1 || null,
      admin2: city.admin2 || null,
      country: city.country || "China",
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: forecast.timezone || city.timezone || null,
    },
    current: {
      time: forecast.current.time,
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      relativeHumidity: forecast.current.relative_humidity_2m,
      windSpeedKmh: forecast.current.wind_speed_10m,
      weatherCode: forecast.current.weather_code,
      condition: weatherInfo(forecast.current.weather_code).label,
    },
    daily: forecast.daily.time.map((date, index) => {
      const code = valueAt(forecast.daily.weather_code, index);
      return {
        date,
        weatherCode: code,
        condition: weatherInfo(code).label,
        temperatureMax: valueAt(forecast.daily.temperature_2m_max, index),
        temperatureMin: valueAt(forecast.daily.temperature_2m_min, index),
        precipitationProbabilityMax: valueAt(forecast.daily.precipitation_probability_max, index),
        windSpeedMaxKmh: valueAt(forecast.daily.wind_speed_10m_max, index),
      };
    }),
    matches: matches.slice(0, 5).map((match) => ({
      name: match.name,
      admin1: match.admin1 || null,
      admin2: match.admin2 || null,
      country: match.country || "China",
      latitude: match.latitude,
      longitude: match.longitude,
    })),
  };
}

function registerAgentTools() {
  if (typeof navigator.modelContext?.registerTool !== "function") {
    return;
  }

  const tool = {
    name: "get_china_city_weather",
    description: "Get current weather and a 7-day forecast for a Chinese city by English name or pinyin.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Chinese city name in English or pinyin, for example Beijing, Shanghai, Guangzhou, Shenzhen, or Xi'an.",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature unit. Defaults to celsius.",
        },
      },
      required: ["city"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async ({ city, unit }) => getWeatherForAgent(city, unit),
  };

  try {
    if (typeof navigator.modelContext.unregisterTool === "function") {
      navigator.modelContext.unregisterTool(tool.name);
    }
  } catch (error) {
    // No prior registration.
  }

  try {
    navigator.modelContext.registerTool(tool);
  } catch (error) {
    // Browsers without active WebMCP support should keep the human UI working.
  }
}

function handleNetworkError(error, fallbackMessage) {
  dom.weatherBoard.hidden = !state.selectedCity;
  const message = error instanceof Error && error.message ? `${fallbackMessage} ${error.message}` : fallbackMessage;
  showStatus(message, "error");
}

function showStatus(message, tone) {
  dom.statusLine.textContent = message;
  dom.statusLine.dataset.tone = tone;
  dom.statusLine.hidden = false;
}

function nextRequest() {
  state.requestId += 1;
  return state.requestId;
}

function weatherInfo(code) {
  const numericCode = Number(code);
  const exact = {
    0: ["Clear sky", "sun"],
    1: ["Mostly clear", "cloudSun"],
    2: ["Partly cloudy", "cloudSun"],
    3: ["Overcast", "cloud"],
    45: ["Fog", "fog"],
    48: ["Rime fog", "fog"],
    51: ["Light drizzle", "rain"],
    53: ["Drizzle", "rain"],
    55: ["Dense drizzle", "rain"],
    56: ["Freezing drizzle", "rain"],
    57: ["Freezing drizzle", "rain"],
    61: ["Light rain", "rain"],
    63: ["Rain", "rain"],
    65: ["Heavy rain", "rain"],
    66: ["Freezing rain", "rain"],
    67: ["Freezing rain", "rain"],
    71: ["Light snow", "snow"],
    73: ["Snow", "snow"],
    75: ["Heavy snow", "snow"],
    77: ["Snow grains", "snow"],
    80: ["Light showers", "rain"],
    81: ["Showers", "rain"],
    82: ["Heavy showers", "rain"],
    85: ["Snow showers", "snow"],
    86: ["Heavy snow showers", "snow"],
    95: ["Thunderstorm", "storm"],
    96: ["Thunderstorm with hail", "storm"],
    99: ["Thunderstorm with hail", "storm"],
  }[numericCode];

  if (!exact) {
    return { label: "Weather update", icon: "cloud" };
  }

  return { label: exact[0], icon: exact[1] };
}

function iconMarkup(name) {
  return ICONS[name] || ICONS.cloud;
}

function formatLocation(city) {
  return [city.admin1, city.admin2, city.country || "China"].filter(Boolean).join(", ");
}

function formatCityDetail(city) {
  const parts = [];

  if (city.population) {
    parts.push(`Population ${formatPopulation(city.population)}`);
  }

  if (city.timezone) {
    parts.push(city.timezone);
  }

  return parts.join(" | ") || "China";
}

function formatPopulation(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(value);
}

function formatTemp(value) {
  if (!Number.isFinite(Number(value))) {
    return "N/A";
  }

  return `${Math.round(Number(value))}\u00B0${state.unit === "fahrenheit" ? "F" : "C"}`;
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) {
    return "N/A";
  }

  return `${Math.round(Number(value))}%`;
}

function formatWind(value) {
  if (!Number.isFinite(Number(value))) {
    return "N/A";
  }

  return `${Math.round(Number(value))} km/h`;
}

function formatDateTime(value) {
  const date = parseApiDate(value);

  if (!date) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

function formatDay(value) {
  const date = parseApiDate(value);

  if (!date) {
    return "Next";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function parseApiDate(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [datePart, timePart = "00:00"] = value.split("T");
  const dateBits = datePart.split("-").map(Number);
  const timeBits = timePart.split(":").map(Number);

  if (dateBits.length < 3 || dateBits.some(Number.isNaN)) {
    return null;
  }

  return new Date(Date.UTC(
    dateBits[0],
    dateBits[1] - 1,
    dateBits[2],
    timeBits[0] || 0,
    timeBits[1] || 0,
  ));
}

function valueAt(values, index) {
  return Array.isArray(values) ? values[index] : undefined;
}

function cityKey(city) {
  return String(city.id || `${city.latitude},${city.longitude}`);
}

function unitName() {
  return state.unit === "fahrenheit" ? "Fahrenheit" : "Celsius";
}

init();
