# China Weather Desk

China Weather Desk is a lightweight weather page for foreigners who need quick weather information for Chinese cities.

## What It Does

- Searches Chinese cities by English name or pinyin.
- Shows current temperature, apparent temperature, humidity, wind speed, and weather condition.
- Shows a 7-day forecast with daily high and low temperatures, rain probability, wind speed, and weather condition.
- Supports Celsius and Fahrenheit.
- Uses English UI labels and English city metadata from Open-Meteo.

## How Agents Can Use It

Use the query parameters:

```text
/?city=Beijing&unit=celsius
/?city=Shanghai&unit=fahrenheit
/?city=Xi%27an&unit=celsius
```

If multiple city matches exist, the UI shows the city name, province or municipality, country, population, and timezone. The app prefers higher administrative rank and larger population.

If WebMCP is available in the browser, use the `get_china_city_weather` tool for a direct structured result instead of clicking through the UI.

## Data Source

The page calls Open-Meteo directly from the browser:

- Geocoding endpoint: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast endpoint: `https://api.open-meteo.com/v1/forecast`

No API key is required.

## Not Included

- Air quality.
- Map display.
- Saved cities.
- Location permission.
- Accounts or authentication.
- First-party MCP server.
