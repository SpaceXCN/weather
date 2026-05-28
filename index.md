# China Weather Desk

China Weather Desk is a lightweight weather page for foreigners who need quick weather information for Chinese cities.

## What It Does

- Searches Chinese cities by English name or pinyin.
- Shows current temperature, apparent temperature, humidity, wind speed, and weather condition.
- Shows a 7-day forecast with daily high and low temperatures, rain probability, wind speed, and weather condition.
- Supports Celsius and Fahrenheit.
- Uses English UI labels and English city metadata from Open-Meteo.
- Displays public site views, visitors, and current page views.
- Provides original traveler guidance, regional weather notes, data-source transparency, and an FAQ on the home page.

## How Agents Can Use It

Use the query parameters:

```text
/?city=Beijing&unit=celsius
/?city=Shanghai&unit=fahrenheit
/?city=Xi%27an&unit=celsius
```

If multiple city matches exist, the UI shows the city name, province or municipality, country, population, and timezone. The app prefers higher administrative rank and larger population.

If WebMCP is available in the browser, use the `get_china_city_weather` tool for a direct structured result instead of clicking through the UI.

Additional AI-readable JSON resources:

- `/.well-known/ai-data.json`: capabilities, query interface, browser-tool metadata, data sources, and limitations.
- `/weather-response.schema.json`: JSON Schema for structured weather responses.

Visible content sections for human readers:

- `#china-weather-guide`: How to use weather data for daily travel decisions.
- `#regional-notes`: Common weather patterns in northern, eastern, southern, southwestern, and central China.
- `#methodology`: Data sources, privacy posture, and transparency notes.
- `#faq`: Weather lookup and usage questions.

## Data Source

The page calls Open-Meteo directly from the browser:

- Geocoding endpoint: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast endpoint: `https://api.open-meteo.com/v1/forecast`
- Visitor counter: `https://busuanzi.ibruce.info/`

No API key is required.

## Not Included

- Air quality.
- Map display.
- Saved cities.
- Location permission.
- Accounts or authentication.
- First-party MCP server.
- First-party analytics backend.
