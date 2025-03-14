"use client";

import { useState } from "react";
import Link from "next/link";
import ResultCard from "./components/ResultCard";
import "./globals.css";
import { runPageSpeedTests } from "./services/pagespeedService";
import { jsPDF } from "jspdf";


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

   const handleExportPDF = () => {
     if (!results || results.length === 0) {
       alert("No results to export");
       return;
     }

     try {
       setLoading(true);

       // Create a new PDF document - using portrait for the card layout
       const doc = new jsPDF({
         orientation: "portrait",
         unit: "pt",
         format: "a4",
       });

       // Constants for layout
       const pageWidth = doc.internal.pageSize.width;
       const pageHeight = doc.internal.pageSize.height;
       const margin = 30;
       const contentWidth = pageWidth - margin * 2;

       // Title and timestamp on first page
       doc.setFontSize(16);
       doc.setTextColor(33, 33, 33);
       doc.text("PageSpeed Insights Report", margin, margin + 10);

       doc.setFontSize(9);
       doc.setTextColor(102, 102, 102);
       doc.text(
         `Generated on ${new Date().toLocaleString()}`,
         margin,
         margin + 25
       );

       // Add horizontal line
       doc.setDrawColor(230, 230, 230);
       doc.setLineWidth(0.5);
       doc.line(margin, margin + 35, pageWidth - margin, margin + 35);

       // Start position for results
       let y = margin + 50;
       const cardsPerRow = 1; // One card per row
       const cardMargin = 15;
       const cardWidth = contentWidth;
       const cardHeight = 190; // Height for each card

       // Color function for scores
       const getScoreColor = (score) => {
         if (score >= 90) return [16, 185, 129]; // green - similar to tailwind's emerald-500
         if (score >= 50) return [245, 158, 11]; // amber - similar to tailwind's amber-500
         return [239, 68, 68]; // red - similar to tailwind's red-500
       };

       // Process each result
       for (let i = 0; i < results.length; i++) {
         const result = results[i];

         // Calculate position
         const rowIndex = Math.floor(i / cardsPerRow);
         const colIndex = i % cardsPerRow;
         const cardX = margin + colIndex * (cardWidth + cardMargin);
         const cardY = y + rowIndex * (cardHeight + cardMargin);

         // Check if we need a new page
         if (cardY + cardHeight > pageHeight - margin) {
           doc.addPage();
           y = margin;
           i--; // Process this result again on the new page
           continue;
         }

         // Create card outline - white card with light gray border
         doc.setDrawColor(226, 232, 240); // tailwind gray-300
         doc.setFillColor(255, 255, 255);
         doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, "FD");

         // URL with strategy badge
         const displayUrl =
           result.url.length > 50
             ? result.url.substring(0, 47) + "..."
             : result.url;

         // URL text
         doc.setFontSize(10);
         doc.setFont(undefined, "bold");
         doc.setTextColor(31, 41, 55); // tailwind gray-800
         doc.text(displayUrl, cardX + 15, cardY + 25);

         // Strategy badge
         const strategy = result.strategy === "mobile" ? "Mobile" : "Desktop";
         doc.setFillColor(240, 240, 240);
         const strategyTextWidth =
           (doc.getStringUnitWidth(strategy) * 9 * doc.internal.scaleFactor) /
           72;
         doc.roundedRect(
           cardX + cardWidth - 15 - strategyTextWidth - 10,
           cardY + 14,
           strategyTextWidth + 10,
           18,
           2,
           2,
           "F"
         );
         doc.setFontSize(9);
         doc.setTextColor(75, 85, 99); // tailwind gray-600
         doc.text(
           strategy,
           cardX + cardWidth - 15 - strategyTextWidth - 5,
           cardY + 25
         );

         if (result.error) {
           // Error display
           doc.setFillColor(254, 226, 226); // tailwind red-100
           doc.roundedRect(
             cardX + 15,
             cardY + 40,
             cardWidth - 30,
             30,
             2,
             2,
             "F"
           );
           doc.setTextColor(220, 38, 38); // tailwind red-600
           doc.setFontSize(10);
           doc.text(`Error: ${result.error}`, cardX + 25, cardY + 60);
         } else if (result.data && result.data.lighthouseResult) {
           const lhr = result.data.lighthouseResult;
           const categories = lhr.categories;

           if (categories) {
             // Performance metrics row
             let metricsY = cardY + 55;

             // Category labels in first row
             doc.setFontSize(9);
             doc.setTextColor(75, 85, 99); // tailwind gray-600

             const metrics = [
               {
                 name: "Performance",
                 score: categories.performance?.score || 0,
               },
               {
                 name: "Accessibility",
                 score: categories.accessibility?.score || 0,
               },
               {
                 name: "Best Practices",
                 score: categories["best-practices"]?.score || 0,
               },
               { name: "Seo", score: categories.seo?.score || 0 },
             ];

             const metricWidth = (cardWidth - 30) / metrics.length;

             metrics.forEach((metric, idx) => {
               const metricX = cardX + 15 + idx * metricWidth;

               // Category name
               doc.text(metric.name, metricX, metricsY);

               // Score with appropriate color
               const score = Math.round(metric.score * 100);
               const scoreColor = getScoreColor(score);
               doc.setFontSize(16);
               doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
               doc.setFont(undefined, "bold");
               doc.text(`${score}`, metricX, metricsY + 20);
             });

             // Reset font
             doc.setFont(undefined, "normal");

             // CORE WEB VITALS section
             const vitalsY = metricsY + 45;

             // Title
             doc.setFontSize(9);
             doc.setTextColor(75, 85, 99); // tailwind gray-600
             doc.setFont(undefined, "bold");
             doc.text("CORE WEB VITALS", cardX + 15, vitalsY);
             doc.setFont(undefined, "normal");

             // Extract web vitals
             const audits = lhr.audits || {};

             // First row of web vitals
             const vitalsRow1 = [
               {
                 name: "LCP:",
                 value:
                   audits["largest-contentful-paint"]?.displayValue || "N/A",
                 score: audits["largest-contentful-paint"]?.score || 0,
               },
               {
                 name: "FID:",
                 value: audits["max-potential-fid"]?.displayValue || "N/A",
                 score: audits["max-potential-fid"]?.score || 0,
               },
               {
                 name: "CLS:",
                 value:
                   audits["cumulative-layout-shift"]?.displayValue || "N/A",
                 score: audits["cumulative-layout-shift"]?.score || 0,
               },
             ];

             // Second row of web vitals
             const vitalsRow2 = [
               {
                 name: "FCP:",
                 value: audits["first-contentful-paint"]?.displayValue || "N/A",
                 score: audits["first-contentful-paint"]?.score || 0,
               },
               {
                 name: "TTI:",
                 value: audits["interactive"]?.displayValue || "N/A",
                 score: audits["interactive"]?.score || 0,
               },
               {
                 name: "TBT:",
                 value: audits["total-blocking-time"]?.displayValue || "N/A",
                 score: audits["total-blocking-time"]?.score || 0,
               },
             ];

             // Function to draw web vitals row
             const drawVitalsRow = (vitals, rowY) => {
               const vitalWidth = (cardWidth - 30) / vitals.length;

               vitals.forEach((vital, idx) => {
                 const vitalX = cardX + 15 + idx * vitalWidth;

                 // Get color for the value
                 const valueColor = getScoreColor(vital.score);

                 // Vital name
                 doc.setFontSize(9);
                 doc.setTextColor(75, 85, 99); // tailwind gray-600
                 doc.text(vital.name, vitalX, rowY);

                 // Vital value with color
                 doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
                 doc.text(vital.value, vitalX + 30, rowY);
               });
             };

             // Draw both rows of web vitals
             drawVitalsRow(vitalsRow1, vitalsY + 20);
             drawVitalsRow(vitalsRow2, vitalsY + 40);

             // View Full Report link at bottom
             const linkY = vitalsY + 70;
             doc.setTextColor(59, 130, 246); // tailwind blue-500
             doc.setFontSize(9);

             const linkText = "View Full Report";
             const linkWidth =
               (doc.getStringUnitWidth(linkText) *
                 9 *
                 doc.internal.scaleFactor) /
               72;
             const linkX = cardX + (cardWidth - linkWidth) / 2; // Center link

             doc.text(linkText, linkX, linkY);
           } else {
             // No data available
             doc.setTextColor(102, 102, 102);
             doc.setFontSize(10);
             doc.text("No valid data available", cardX + 15, cardY + 60);
           }
         } else {
           // No data available
           doc.setTextColor(102, 102, 102);
           doc.setFontSize(10);
           doc.text("No valid data available", cardX + 15, cardY + 60);
         }
       }

       // Save and download PDF
       doc.save("pagespeed-report.pdf");
     } catch (error) {
       console.error("PDF generation error:", error);
       alert(`Error generating PDF: ${error.message}`);
     } finally {
       setLoading(false);
     }
   };
 
  // Handle exporting results
    const handleExportCSV = async () => {
      if (!results || results.length === 0) {
        alert("No results to export");
        return;
      }

      try {
        setLoading(true);
        console.log(
          `Sending CSV export request with ${results.length} results`
        );

        const response = await fetch("/api/export/csv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            results,
            reportName: "PageSpeed Insights Report",
          }),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          let errorMessage = `Failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse the error response as JSON, just use the status code
          }
          throw new Error(errorMessage);
        }

        // Handle the exported file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Create a link and trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = `pagespeed-report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Export error:", error);
        alert(`Error exporting as CSV: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    

    // Modified handleExport function to call the appropriate method
    const handleExport = (format) => {
      if (format === "csv") {
        handleExportCSV();
      } else if (format === "pdf") {
        handleExportPDF();
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
