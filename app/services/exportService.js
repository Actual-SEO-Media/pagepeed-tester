import PDFDocument from "pdfkit";
import { Parser } from "json2csv";

/**
 * Generate a PDF report from PageSpeed test results
 * @param {Array} results - Array of test results
 * @param {string} reportName - Name of the report
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function generatePDFReport(results, reportName) {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      // Collect chunks of the PDF
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => {
        console.error("PDFKit error:", err);
        reject(err);
      });

      // Add title
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("PageSpeed Insights Report", 50, 60)
        .fontSize(16)
        .font("Helvetica")
        .text(reportName || "Generated Report", 50, 100);

      // Add timestamp
      doc
        .fontSize(10)
        .text(`Generated on ${new Date().toLocaleString()}`, 50, 130);

      // Add horizontal line
      doc
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .moveTo(50, 150)
        .lineTo(doc.page.width - 50, 150)
        .stroke();

      // Basic summary
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Summary", 50, 180)
        .fontSize(12)
        .font("Helvetica")
        .text(`URLs tested: ${results.length}`, 50, 210);

      // Add results section
      doc.addPage();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Results by URL", 50, 60)
        .fontSize(12)
        .font("Helvetica");

      // Loop through results
      let yPosition = 100;
      results.forEach((result, index) => {
        if (yPosition > doc.page.height - 150) {
          doc.addPage();
          yPosition = 60;
        }

        doc.font("Helvetica-Bold").text(`URL: ${result.url}`, 50, yPosition);
        yPosition += 20;

        doc.font("Helvetica");

        if (result.error) {
          doc.text(`Error: ${result.error}`, 50, yPosition);
          yPosition += 20;
        } else if (result.data && result.data.lighthouseResult) {
          const lhr = result.data.lighthouseResult;
          const categories = lhr.categories;

          // Display scores
          if (categories) {
            Object.entries(categories).forEach(([key, category]) => {
              const readableKey =
                key === "best-practices"
                  ? "Best Practices"
                  : key.charAt(0).toUpperCase() + key.slice(1);
              const score = category.score
                ? Math.round(category.score * 100)
                : "N/A";
              doc.text(`${readableKey}: ${score}%`, 50, yPosition);
              yPosition += 15;
            });
          }

          yPosition += 10;
        } else {
          doc.text("No valid data available", 50, yPosition);
          yPosition += 20;
        }

        yPosition += 20; // Add spacing between results
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error("Error creating PDF:", error);
      reject(error);
    }
  });
}

/**
 * Generate a CSV export of PageSpeed test results
 * @param {Array} results - Array of test results
 * @returns {string} - CSV content
 */
export function generateCSVReport(results) {
  // Prepare data for CSV export
  const fields = [
    "url",
    "strategy",
    "performanceScore",
    "accessibilityScore",
    "bestPracticesScore",
    "seoScore",
    "firstContentfulPaint",
    "largestContentfulPaint",
    "cumulativeLayoutShift",
    "totalBlockingTime",
    "speedIndex",
    "interactive",
    "testDate",
  ];

  // Convert results to CSV-friendly format
  const csvData = results.map((result) => {
    if (result.error || !result.data || !result.data.lighthouseResult) {
      return {
        url: result.url,
        strategy: result.strategy || "mobile",
        testDate: new Date().toISOString(),
        error: result.error || "Invalid data",
      };
    }

    const lhr = result.data.lighthouseResult;
    const audits = lhr.audits || {};
    const categories = lhr.categories || {};

    return {
      url: result.url,
      strategy: result.strategy || "mobile",
      performanceScore: categories.performance?.score
        ? Math.round(categories.performance.score * 100)
        : "N/A",
      accessibilityScore: categories.accessibility?.score
        ? Math.round(categories.accessibility.score * 100)
        : "N/A",
      bestPracticesScore: categories["best-practices"]?.score
        ? Math.round(categories["best-practices"].score * 100)
        : "N/A",
      seoScore: categories.seo?.score
        ? Math.round(categories.seo.score * 100)
        : "N/A",
      firstContentfulPaint:
        audits["first-contentful-paint"]?.displayValue || "N/A",
      largestContentfulPaint:
        audits["largest-contentful-paint"]?.displayValue || "N/A",
      cumulativeLayoutShift:
        audits["cumulative-layout-shift"]?.displayValue || "N/A",
      totalBlockingTime: audits["total-blocking-time"]?.displayValue || "N/A",
      speedIndex: audits["speed-index"]?.displayValue || "N/A",
      interactive: audits["interactive"]?.displayValue || "N/A",
      testDate: result.data.analysisUTCTimestamp || new Date().toISOString(),
    };
  });

  try {
    // Generate CSV
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(csvData);
  } catch (error) {
    console.error("Error generating CSV:", error);
    throw error;
  }
}
