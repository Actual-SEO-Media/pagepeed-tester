// File: src/app/api/pagespeed/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url, apiKey, strategy = "desktop" } = await request.json();

    if (!url || !apiKey) {
      return NextResponse.json(
        { error: "URL and API key are required" },
        { status: 400 }
      );
    }

    // Create URL params correctly to handle multiple categories
    const params = new URLSearchParams();
    params.append("url", url);
    params.append("key", apiKey);
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");
    params.append("strategy", strategy);

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "API request failed";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the text as is
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
