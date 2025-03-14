import { NextResponse } from "next/server";
import {
  generatePDFReport,
  generateCSVReport,
} from "../../../services/exportService";

export async function POST(request, { params }) {
  try {
    console.log("Received params:", params);
    const { format } = params;

    let requestData;
    try {
      requestData = await request.json();
      console.log("Processing export request for format:", format);
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
      try {
        console.log("Generating CSV report");
        const csvContent = generateCSVReport(results);

        return new Response(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="pagespeed-report.csv"`,
          },
        });
      } catch (csvError) {
        console.error("CSV generation error:", csvError);
        return NextResponse.json(
          { error: `CSV generation failed: ${csvError.message}` },
          { status: 500 }
        );
      }
    }

    if (format === "pdf") {
      try {
        console.log("Generating PDF report");
        const pdfBuffer = await generatePDFReport(results, reportName);

        return new Response(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="pagespeed-report.pdf"`,
          },
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        return NextResponse.json(
          { error: `PDF generation failed: ${pdfError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Unsupported export format. Supported formats: pdf, csv" },
      { status: 400 }
    );
  } catch (error) {
    console.error("General export error:", error);
    return NextResponse.json(
      { error: `Export failed: ${error.message}` },
      { status: 500 }
    );
  }
}
