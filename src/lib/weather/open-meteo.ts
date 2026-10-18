export type DailyForecast = {
  date: string; // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationProbability: number; // 0..100
  windMaxKmh: number;
};

/** 7-Tage-Vorhersage von Open-Meteo, ohne API-Key. */
export async function fetchForecast(lat: number, lon: number): Promise<DailyForecast[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
  );
  url.searchParams.set("timezone", "Europe/Zurich");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  const data = (await res.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      precipitation_probability_max: number[];
      wind_speed_10m_max: number[];
    };
  };
  return data.daily.time.map((date, i) => ({
    date,
    tempMaxC: data.daily.temperature_2m_max[i],
    tempMinC: data.daily.temperature_2m_min[i],
    precipitationMm: data.daily.precipitation_sum[i],
    precipitationProbability: data.daily.precipitation_probability_max[i],
    windMaxKmh: data.daily.wind_speed_10m_max[i],
  }));
}
