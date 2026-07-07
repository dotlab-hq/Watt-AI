import { tool } from "ai";
import { z } from "zod";

export const localTime = tool({
  description:
    "Get the current local time and date for a city or timezone. Useful for knowing what time it is somewhere in the world.",
  inputSchema: z.object({
    city: z
      .string()
      .describe("City name (e.g., 'Tokyo', 'New York', 'London')"),
    timezone: z
      .string()
      .optional()
      .describe(
        "IANA timezone (e.g., 'Asia/Tokyo', 'America/New_York'). If not provided, the city name will be used to infer it."
      ),
  }),
  execute: async (input) => {
    // Try to get timezone from the API if not provided
    let tz = input.timezone;

    if (!tz) {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.city)}&count=1&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.results?.[0]?.timezone) {
            tz = data.results[0].timezone;
          }
        }
      } catch {
        // fallback below
      }
    }

    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
      timeZone: tz || undefined,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });

    return {
      city: input.city,
      timezone: tz,
      localTime: timeStr,
      utcOffset: now
        .toLocaleString("en-US", {
          timeZone: tz || undefined,
          timeZoneName: "longOffset",
        })
        .split(",")
        .pop()
        ?.trim(),
    };
  },
});
