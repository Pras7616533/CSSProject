// Open-Meteo API Endpoints
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const themeToggle = document.getElementById('theme-toggle');
const weatherContent = document.getElementById('weather-content');
const welcomeMessage = document.getElementById('welcome-message');
const loadingSpinner = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Weather Display Elements
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weather-condition');
const weatherIcon = document.getElementById('weather-icon');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const forecastContainer = document.getElementById('forecast-container');

// State
let isDarkMode = false;

// WMO Weather Codes Mapping
const weatherCodes = {
    0: { desc: 'Clear sky', icon: '01d', bg: 'clear' },
    1: { desc: 'Mainly clear', icon: '02d', bg: 'clear' },
    2: { desc: 'Partly cloudy', icon: '03d', bg: 'clouds' },
    3: { desc: 'Overcast', icon: '04d', bg: 'clouds' },
    45: { desc: 'Fog', icon: '50d', bg: 'mist' },
    48: { desc: 'Depositing rime fog', icon: '50d', bg: 'mist' },
    51: { desc: 'Light drizzle', icon: '09d', bg: 'rain' },
    53: { desc: 'Moderate drizzle', icon: '09d', bg: 'rain' },
    55: { desc: 'Dense drizzle', icon: '09d', bg: 'rain' },
    61: { desc: 'Slight rain', icon: '10d', bg: 'rain' },
    63: { desc: 'Moderate rain', icon: '10d', bg: 'rain' },
    65: { desc: 'Heavy rain', icon: '10d', bg: 'rain' },
    71: { desc: 'Slight snow fall', icon: '13d', bg: 'snow' },
    73: { desc: 'Moderate snow fall', icon: '13d', bg: 'snow' },
    75: { desc: 'Heavy snow fall', icon: '13d', bg: 'snow' },
    77: { desc: 'Snow grains', icon: '13d', bg: 'snow' },
    80: { desc: 'Slight rain showers', icon: '09d', bg: 'rain' },
    81: { desc: 'Moderate rain showers', icon: '09d', bg: 'rain' },
    82: { desc: 'Violent rain showers', icon: '09d', bg: 'rain' },
    85: { desc: 'Slight snow showers', icon: '13d', bg: 'snow' },
    86: { desc: 'Heavy snow showers', icon: '13d', bg: 'snow' },
    95: { desc: 'Thunderstorm', icon: '11d', bg: 'thunderstorm' },
    96: { desc: 'Thunderstorm with slight hail', icon: '11d', bg: 'thunderstorm' },
    99: { desc: 'Thunderstorm with heavy hail', icon: '11d', bg: 'thunderstorm' },
};

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        searchCity(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            searchCity(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(latitude, longitude, "Your Location");
            },
            (error) => {
                showError("Location access denied. Please search for a city manually.");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeToggle.innerHTML = isDarkMode ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

// Functions
async function searchCity(city) {
    showLoading();
    try {
        const response = await fetch(`${GEOCODING_API_URL}?name=${city}&count=1&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const name = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}, ${result.country}`;
            fetchWeatherData(result.latitude, result.longitude, name);
        } else {
            showError("City not found. Please try again.");
        }
    } catch (error) {
        showError("Failed to fetch location data. Please check your connection.");
    }
}

async function fetchWeatherData(lat, lon, locationLabel) {
    try {
        const response = await fetch(`${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await response.json();

        if (response.ok) {
            updateUI(data, locationLabel);
        } else {
            showError("Weather data not available for this location.");
        }
    } catch (error) {
        showError("Failed to fetch weather data.");
    }
}

function updateUI(data, locationLabel) {
    hideLoading();
    welcomeMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherContent.classList.remove('hidden');

    const current = data.current;
    const weatherInfo = weatherCodes[current.weather_code] || { desc: 'Unknown', icon: '01d', bg: 'clear' };

    cityName.textContent = locationLabel;
    currentDate.textContent = formatDate(new Date());
    temperature.textContent = Math.round(current.temperature_2m);
    weatherCondition.textContent = weatherInfo.desc;
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherInfo.icon}@4x.png`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;

    updateBackground(weatherInfo.bg);
    updateForecast(data.daily);
    
    // Animate the card
    const appContainer = document.querySelector('.app-container');
    appContainer.style.transform = 'scale(1.02)';
    setTimeout(() => {
        appContainer.style.transform = 'scale(1)';
    }, 200);
}

function updateForecast(dailyData) {
    forecastContainer.innerHTML = '';
    
    // Open-Meteo returns arrays for each daily property
    for (let i = 1; i < 6; i++) { // Next 5 days
        const date = new Date(dailyData.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherInfo = weatherCodes[dailyData.weather_code[i]] || { desc: 'Unknown', icon: '01d' };
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <span class="day">${dayName}</span>
            <img src="https://openweathermap.org/img/wn/${weatherInfo.icon}.png" alt="Weather">
            <span class="temp">${Math.round(dailyData.temperature_2m_max[i])}°C</span>
        `;
        forecastContainer.appendChild(forecastCard);
    }
}

function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

function showLoading() {
    welcomeMessage.classList.add('hidden');
    weatherContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    welcomeMessage.classList.add('hidden');
    weatherContent.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    errorText.textContent = message;
}

function updateBackground(condition) {
    const body = document.body;
    let gradient = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'; // default (Night/Clear blue)

    switch(condition.toLowerCase()) {
        case 'clear':
            gradient = 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)';
            break;
        case 'clouds':
            gradient = 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)';
            break;
        case 'rain':
            gradient = 'linear-gradient(135deg, #203a43 0%, #2c5364 100%)';
            break;
        case 'thunderstorm':
            gradient = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
            break;
        case 'snow':
            gradient = 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)';
            break;
        case 'mist':
            gradient = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
            break;
    }
    
    if (!isDarkMode) {
        body.style.background = gradient;
        body.style.backgroundAttachment = 'fixed';
    }
}
