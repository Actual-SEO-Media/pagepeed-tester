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
    // Create a PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    // Collect chunks of the PDF
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Add report header
    addReportHeader(doc, reportName);

    // Add summary section
    addSummarySection(doc, results);

    // Add detailed results for each URL
    addDetailedResults(doc, results);

    // Add footer with timestamp
    addFooter(doc);

    // Finalize the PDF
    doc.end();
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

  const csvData = results.map((result) => {
    if (!result.data || !result.data.lighthouseResult) {
      return {
        url: result.url,
        strategy: result.strategy || "mobile",
        testDate: new Date().toISOString(),
      };
    }

    const lhr = result.data.lighthouseResult;
    const audits = lhr.audits;

    return {
      url: result.url,
      strategy: result.strategy || "mobile",
      performanceScore: Math.round(lhr.categories.performance.score * 100),
      accessibilityScore: Math.round(lhr.categories.accessibility.score * 100),
      bestPracticesScore: Math.round(
        lhr.categories["best-practices"].score * 100
      ),
      seoScore: Math.round(lhr.categories.seo.score * 100),
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

  // Generate CSV
  const json2csvParser = new Parser({ fields });
  return json2csvParser.parse(csvData);
}

// Helper functions for PDF generation
function addReportHeader(doc, reportName) {
  // Add title
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("PageSpeed Insights Report", 50, 60)
    .fontSize(16)
    .font("Helvetica")
    .text(reportName, 50);

  // Add horizontal line
  doc
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .moveTo(50, 100)
    .lineTo(doc.page.width - 50, 100)
    .stroke();

  // Move to content starting position
  doc.moveDown(2);
}

function addSummarySection(doc, results) {
  doc.fontSize(16).font("Helvetica-Bold").text("Summary", { underline: true });

  doc.fontSize(12).font("Helvetica").moveDown(0.5);

  // Calculate summary data
  const testDate = new Date().toLocaleDateString();
  const uniqueUrls = [...new Set(results.map((r) => r.url))];

  // Collect scores for average calculation
  let totalPerformance = 0;
  let totalAccessibility = 0;
  let totalBestPractices = 0;
  let totalSeo = 0;
  let validResultsCount = 0;

  results.forEach((result) => {
    if (result.data && result.data.lighthouseResult) {
      const lhr = result.data.lighthouseResult;
      totalPerformance += lhr.categories.performance.score * 100;
      totalAccessibility += lhr.categories.accessibility.score * 100;
      totalBestPractices += lhr.categories["best-practices"].score * 100;
      totalSeo += lhr.categories.seo.score * 100;
      validResultsCount++;
    }
  });

  // Add summary information
  doc
    .text(`Report Date: ${testDate}`)
    .text(`URLs Tested: ${uniqueUrls.length}`)
    .text(`Tests Run: ${results.length}`)
    .moveDown(1);

  // Add average scores if valid results exist
  if (validResultsCount > 0) {
    const avgPerformance = Math.round(totalPerformance / validResultsCount);
    const avgAccessibility = Math.round(totalAccessibility / validResultsCount);
    const avgBestPractices = Math.round(totalBestPractices / validResultsCount);
    const avgSeo = Math.round(totalSeo / validResultsCount);

    doc
      .font("Helvetica-Bold")
      .text("Average Scores", { underline: true })
      .moveDown(0.5)
      .font("Helvetica");

    // Draw score boxes
    const scoreBoxWidth = 110;
    const scoreBoxHeight = 60;
    const startX = 50;
    const startY = doc.y;
    const padding = 10;

    // Performance score box
    drawScoreBox(
      doc,
      startX,
      startY,
      scoreBoxWidth,
      scoreBoxHeight,
      "Performance",
      avgPerformance,
      getColorForScore(avgPerformance)
    );

    // Accessibility score box
    drawScoreBox(
      doc,
      startX + scoreBoxWidth + padding,
      startY,
      scoreBoxWidth,
      scoreBoxHeight,
      "Accessibility",
      avgAccessibility,
      getColorForScore(avgAccessibility)
    );

    // Best Practices score box
    drawScoreBox(
      doc,
      startX + (scoreBoxWidth + padding) * 2,
      startY,
      scoreBoxWidth,
      scoreBoxHeight,
      "Best Practices",
      avgBestPractices,
      getColorForScore(avgBestPractices)
    );

    // SEO score box
    drawScoreBox(
      doc,
      startX + (scoreBoxWidth + padding) * 3,
      startY,
      scoreBoxWidth,
      scoreBoxHeight,
      "SEO",
      avgSeo,
      getColorForScore(avgSeo)
    );

    // Move past the score boxes
    doc.moveDown(5);
  }
}

function addDetailedResults(doc, results) {
  // Group results by URL
  const resultsByUrl = {};

  results.forEach((result) => {
    if (!resultsByUrl[result.url]) {
      resultsByUrl[result.url] = [];
    }
    resultsByUrl[result.url].push(result);
  });

  doc.addPage(); // Start detailed results on a new page

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Detailed Results", { underline: true })
    .moveDown(1);

  // Add results for each URL
  Object.keys(resultsByUrl).forEach((url, index) => {
    if (index > 0) {
      // Add a page break between URLs unless it's the first URL
      doc.addPage();
    }

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(url, { underline: true })
      .moveDown(0.5);

    // Process results for this URL
    resultsByUrl[url].forEach((result) => {
      if (!result.data || !result.data.lighthouseResult) {
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            `No valid data available for ${result.strategy || "mobile"} test`
          )
          .moveDown(1);
        return;
      }

      const lhr = result.data.lighthouseResult;
      const audits = lhr.audits;
      const strategy = result.strategy || "mobile";

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Results`)
        .moveDown(0.5);

      // Draw scores
      const performanceScore = Math.round(
        lhr.categories.performance.score * 100
      );
      const accessibilityScore = Math.round(
        lhr.categories.accessibility.score * 100
      );
      const bestPracticesScore = Math.round(
        lhr.categories["best-practices"].score * 100
      );
      const seoScore = Math.round(lhr.categories.seo.score * 100);

      // Draw score boxes
      const scoreBoxWidth = 110;
      const scoreBoxHeight = 60;
      const startX = 50;
      const startY = doc.y;
      const padding = 10;

      drawScoreBox(
        doc,
        startX,
        startY,
        scoreBoxWidth,
        scoreBoxHeight,
        "Performance",
        performanceScore,
        getColorForScore(performanceScore)
      );

      drawScoreBox(
        doc,
        startX + scoreBoxWidth + padding,
        startY,
        scoreBoxWidth,
        scoreBoxHeight,
        "Accessibility",
        accessibilityScore,
        getColorForScore(accessibilityScore)
      );

      drawScoreBox(
        doc,
        startX + (scoreBoxWidth + padding) * 2,
        startY,
        scoreBoxWidth,
        scoreBoxHeight,
        "Best Practices",
        bestPracticesScore,
        getColorForScore(bestPracticesScore)
      );

      drawScoreBox(
        doc,
        startX + (scoreBoxWidth + padding) * 3,
        startY,
        scoreBoxWidth,
        scoreBoxHeight,
        "SEO",
        seoScore,
        getColorForScore(seoScore)
      );

      // Move past the score boxes
      doc.moveDown(5);

      // Add core web vitals section
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("Core Web Vitals")
        .moveDown(0.5);

      // Create a table for Core Web Vitals
      const webVitals = [
        {
          name: "LCP (Largest Contentful Paint)",
          value: audits["largest-contentful-paint"]?.displayValue || "N/A",
          score: audits["largest-contentful-paint"]?.score,
        },
        {
          name: "FID (First Input Delay)",
          value: audits["max-potential-fid"]?.displayValue || "N/A",
          score: audits["max-potential-fid"]?.score,
        },
        {
          name: "CLS (Cumulative Layout Shift)",
          value: audits["cumulative-layout-shift"]?.displayValue || "N/A",
          score: audits["cumulative-layout-shift"]?.score,
        },
        {
          name: "FCP (First Contentful Paint)",
          value: audits["first-contentful-paint"]?.displayValue || "N/A",
          score: audits["first-contentful-paint"]?.score,
        },
        {
          name: "TTI (Time to Interactive)",
          value: audits["interactive"]?.displayValue || "N/A",
          score: audits["interactive"]?.score,
        },
        {
          name: "TBT (Total Blocking Time)",
          value: audits["total-blocking-time"]?.displayValue || "N/A",
          score: audits["total-blocking-time"]?.score,
        },
        {
          name: "Speed Index",
          value: audits["speed-index"]?.displayValue || "N/A",
          score: audits["speed-index"]?.score,
        },
      ];

      // Draw table for web vitals
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = [300, 150];
      const rowHeight = 25;

      // Draw table headers
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000");

      doc
        .rect(tableLeft, tableTop, colWidth[0] + colWidth[1], rowHeight)
        .fillAndStroke("#f3f4f6", "#e5e7eb");

      doc.text("Metric", tableLeft + 10, tableTop + 7);
      doc.text("Value", tableLeft + colWidth[0] + 10, tableTop + 7);

      // Draw table rows
      webVitals.forEach((vital, i) => {
        const rowY = tableTop + rowHeight * (i + 1);

        // Draw cell backgrounds and borders
        doc
          .rect(tableLeft, rowY, colWidth[0], rowHeight)
          .fillAndStroke("#ffffff", "#e5e7eb");

        doc
          .rect(tableLeft + colWidth[0], rowY, colWidth[1], rowHeight)
          .fillAndStroke("#ffffff", "#e5e7eb");

        // Draw cell content
        doc
          .font("Helvetica")
          .fillColor("#000000")
          .text(vital.name, tableLeft + 10, rowY + 7);

        const valueColor = vital.score
          ? getColorForScore(vital.score * 100)
          : "#000000";
        doc
          .fillColor(valueColor)
          .text(vital.value, tableLeft + colWidth[0] + 10, rowY + 7);
      });

      // Move to the bottom of the table
      doc.moveDown(webVitals.length + 1);
    });
  });
}

function addFooter(doc) {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Add page numbers at the bottom
    doc
      .fontSize(8)
      .fillColor("#6b7280")
      .text(`Page ${i + 1} of ${pageCount}`, 0, doc.page.height - 50, {
        align: "center",
      });

    // Add timestamp
    doc
      .fontSize(8)
      .fillColor("#6b7280")
      .text(
        `Generated on ${new Date().toLocaleString()}`,
        0,
        doc.page.height - 40,
        { align: "center" }
      );
  }
}

// Helper function to draw a score box
function drawScoreBox(doc, x, y, width, height, label, score, color) {
  // Draw box
  doc.rect(x, y, width, height).fillAndStroke("#ffffff", "#e5e7eb");

  // Add label at the top
  doc
    .fillColor("#000000")
    .fontSize(10)
    .font("Helvetica")
    .text(label, x, y + 10, { width, align: "center" });

  // Add score in the middle
  doc
    .fillColor(color)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(`${score}%`, x, y + 25, { width, align: "center" });
}

// Helper function to get color based on score
function getColorForScore(score) {
  if (score >= 90) return "#059669"; // green
  if (score >= 50) return "#d97706"; // orange
  return "#dc2626"; // red
}
