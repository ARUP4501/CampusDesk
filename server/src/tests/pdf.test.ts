import { describe, it, expect } from "vitest";
import { generateBonafidePdf, generateTicketSlipPdf } from "../services/pdf.service.js";

describe("PDF Generation Services", () => {
  it("should generate a valid Bonafide Certificate PDF buffer", async () => {
    const buffer = await generateBonafidePdf({
      certificateNumber: "DOC-3001",
      studentName: "Aarav Sharma",
      rollNumber: "2024CS101",
      branch: "Computer Science",
      year: 2,
      batch: "2024",
      purpose: "State Merit Scholarship Application",
      issueDate: new Date()
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF Magic Number %PDF
    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });

  it("should generate a valid Ticket Slip PDF buffer", async () => {
    const buffer = await generateTicketSlipPdf({
      ticketNumber: "CD-1001",
      studentName: "Aarav Sharma",
      rollNumber: "2024CS101",
      category: "PLUMBING",
      hostelBlock: "Hostel-A",
      roomNumber: "A-204",
      title: "Tap leaking in washroom",
      description: "Water continuously dripping from sink tap.",
      priority: "HIGH",
      status: "SUBMITTED",
      createdAt: new Date()
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });
});
