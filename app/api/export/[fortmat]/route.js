
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    console.log("Received params:", params);
    const { format } = params;

    let requestData;
    try {
      requestData = await request.json();
      console.log(
        "Received data:",
        JSON.stringify(requestData).substring(0, 200) + "..."
      );
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { results, reportName = "PageSpeed Report" } = requestData;

    if (!results || !Array.isArray(results) || results.length === 0) {
      console.error("Invalid results data:", results);
      return NextResponse.json(
        { error: "Invalid or empty results data" },
        { status: 400 }
      );
    }

    if (format === "csv") {
      const csvContent = generateCSVReport(results);

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="pagespeed-report-${formatFilename(
            reportName
          )}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const pdfContent = generatePDFReport(results);
      return new Response(pdfContent, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="pagespeed-report-${formatFilename(
            reportName
          )}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported export format. Supported formats: pdf, csv" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error generating export:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to format filename
function formatFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}