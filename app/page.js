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

    if (urlList.length > 50) {
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

  // // Handle exporting results
  // const handleExport = async (format) => {
  //   if (!results || results.length === 0) {
  //     alert("No results to export");
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`/api/export/${format}`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         results,
  //         reportName: "PageSpeed Insights Report",
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to generate ${format.toUpperCase()} export`);
  //     }

  //     // Handle the exported file
  //     const blob = await response.blob();
  //     const url = URL.createObjectURL(blob);

  //     // Create a link and trigger download
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `pagespeed-report.${format}`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Export error:", error);
  //     alert(`Error exporting as ${format.toUpperCase()}: ${error.message}`);
  //   }
  // };

  const handleExport = async (format) => {
    try {
      console.log(`Sending ${format} export request`);

      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          format: format,
        }),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      alert(`${format} export request successful!`);
    } catch (error) {
      console.error("Export error:", error);
      alert(`Error: ${error.message}`);
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
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-medium text-gray-900 sm:text-3xl">
            PageSpeed Insights Bulk Tester
          </h1>
          <Link
            href="/scheduled-tests"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Scheduled Tests
          </Link>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="apiKey"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Google PageSpeed API Key
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Get one from{" "}
                  <a
                    href="https://developers.google.com/speed/docs/insights/v5/get-started"
                    className="text-blue-600 hover:underline"
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
                className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your API key"
                required
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Test Strategy
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="mobile"
                    checked={strategy === "mobile"}
                    onChange={() => setStrategy("mobile")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mobile</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="desktop"
                    checked={strategy === "desktop"}
                    onChange={() => setStrategy("desktop")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Desktop</span>
                </label>
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="urls"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                URLs to Test (one per line, max 27)
              </label>
              <textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="h-36 w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
                loading ? "bg-gray-400" : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {loading ? "Running Tests..." : "Run PageSpeed Tests"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="results">
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
              <h2 className="text-xl font-medium text-gray-900">Results</h2>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleExport("csv")}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  Export PDF
                </button>
                <button
                  onClick={handleSaveAsScheduled}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
                >
                  Schedule This Test
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
