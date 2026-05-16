---
name: china-weather-lookup
description: Look up current weather and a 7-day forecast for Chinese cities by English name or pinyin.
version: 1.0.0
license: MIT
---

# China Weather Lookup

Use this skill when a user asks for current weather or a 7-day forecast for a Chinese city.

## Inputs

- `city`: Required. City name in English or pinyin, such as `Beijing`, `Shanghai`, `Guangzhou`, `Shenzhen`, or `Xi'an`.
- `unit`: Optional. `celsius` or `fahrenheit`. Defaults to `celsius`.

## Browser Use

Open the weather page with query parameters:

```text
/?city=Beijing&unit=celsius
/?city=Shanghai&unit=fahrenheit
```

Read the current weather panel and the 7-day forecast cards.

## Structured Tool Use

If the browser exposes WebMCP, call the read-only tool:

```json
{
  "tool": "get_china_city_weather",
  "arguments": {
    "city": "Beijing",
    "unit": "celsius"
  }
}
```

The tool returns city metadata, current weather, daily forecasts, and possible city matches.

## Data Source

The app uses Open-Meteo Geocoding and Forecast APIs directly from the browser. No API key is required.

## Failure Handling

- If no Chinese city matches the query, tell the user no city was found and ask for a more specific city name.
- If the network or upstream API fails, report that the weather forecast is temporarily unavailable.
