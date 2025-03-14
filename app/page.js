"use client";

import { useState } from "react";
import Link from "next/link";
import ResultCard from "./components/ResultCard";
import "./globals.css";
import { runPageSpeedTests } from "./services/pagespeedService";

export default function Home() {
  const [urls, setUrls] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [strategy, setStrategy] = useState("mobile");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Split and trim URLs
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    // Validate URL count
    if (urlList.length === 0) {
      setError("Please enter at least one URL");
      return;
    }

    if (urlList.length > 27) {
      setError("Maximum 27 URLs allowed");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Call the PageSpeed service function
      const testResults = await runPageSpeedTests(urlList, apiKey, strategy);
      setResults(testResults);
    } catch (error) {
      setError(`Error running tests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle exporting results
  const handleExport = async (format) => {
    if (!results || results.length === 0) {
      alert("No results to export");
      return;
    }

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          results,
          reportName: "PageSpeed Insights Report",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()} export`);
      }

      // Handle the exported file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `pagespeed-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(`Error exporting as ${format.toUpperCase()}: ${error.message}`);
    }
  };

  // Function to save current tests as a scheduled test
  const handleSaveAsScheduled = () => {
    // Store current settings in sessionStorage
    if (results.length > 0) {
      const scheduledData = {
        urls: results.map((r) => r.url),
        strategy,
        apiKey,
      };
      sessionStorage.setItem("newScheduledTest", JSON.stringify(scheduledData));
      window.location.href = "/scheduled-tests";
    } else {
      alert("Please run tests first before scheduling");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">PageSpeed Insights Bulk Tester</h1>
          <Link
            href="/scheduled-tests"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Scheduled Tests
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label htmlFor="apiKey" className="block mb-2 font-semibold">
              Google PageSpeed API Key
              <span className="text-sm font-normal ml-2 text-gray-500">
                (Get one from{" "}
                <a
                  href="https://developers.google.com/speed/docs/insights/v5/get-started"
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                </a>
                )
              </span>
            </label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your API key"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Test Strategy</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="mobile"
                  checked={strategy === "mobile"}
                  onChange={() => setStrategy("mobile")}
                  className="mr-2"
                />
                Mobile
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="desktop"
                  checked={strategy === "desktop"}
                  onChange={() => setStrategy("desktop")}
                  className="mr-2"
                />
                Desktop
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="urls" className="block mb-2 font-semibold">
              URLs to Test (one per line, max 27)
            </label>
            <textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="w-full p-2 border rounded h-40"
              placeholder="https://example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`py-2 px-6 rounded font-semibold text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Running Tests..." : "Run PageSpeed Tests"}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="results">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Results</h2>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleExport("pdf")}
                  className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport("html")}
                  className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                >
                  Export HTML
                </button>
                <button
                  onClick={handleSaveAsScheduled}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Schedule This Test
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <ResultCard key={index} result={result} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
