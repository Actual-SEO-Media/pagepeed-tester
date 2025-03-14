/**
 * Run PageSpeed tests for multiple URLs
 * @param {Array<string>} urls - Array of URLs to test
 * @param {string} apiKey - Google PageSpeed API key
 * @param {string} strategy - Test strategy ('mobile' or 'desktop')
 * @returns {Promise<Array>} - Array of test results
 */
export async function runPageSpeedTests(urls, apiKey, strategy = "mobile") {
  try {
    // Run tests in parallel
    const promises = urls.map((url) => runPageSpeedTest(url, apiKey, strategy));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error running PageSpeed tests:", error);
    throw error;
  }
}

/**
 * Run a PageSpeed test for a single URL
 * @param {string} url - URL to test
 * @param {string} apiKey - Google PageSpeed API key
 * @param {string} strategy - Test strategy ('mobile' or 'desktop')
 * @returns {Promise<Object>} - Test result
 */
async function runPageSpeedTest(url, apiKey, strategy) {
  try {
    // Make sure the URL is properly formatted
    let processedUrl = url;

    if (!/^https?:\/\//.test(processedUrl)) {
      processedUrl = "https://" + processedUrl;
    }

    // Create URL params
    const params = new URLSearchParams();
    params.append("url", processedUrl);
    params.append("key", apiKey);
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");
    params.append("strategy", strategy);

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    console.log(`Running ${strategy} test for: ${processedUrl}`);

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
    return { url: processedUrl, data, strategy };
  } catch (error) {
    console.error(`Error testing ${url}:`, error);
    return { url, error: error.message, strategy };
  }
}
