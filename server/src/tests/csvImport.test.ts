import { describe, it, expect } from "vitest";
import {
  importStudentsCsv,
  importTimetableCsv,
  importFeesCsv,
  importMessMenuCsv
} from "../services/csvImport.service.js";

describe("CSV Migration Import Validation", () => {
  it("should detect invalid students CSV format or missing columns", async () => {
    const badCsv = Buffer.from("rollNumber,invalidHeader\n2024CS101,Aarav");
    const res = await importStudentsCsv(badCsv);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0]).toContain("Missing required fields");
  });

  it("should detect missing fields in timetable CSV", async () => {
    const badCsv = Buffer.from("branch,year,subjectCode\nCSE,2,CS101");
    const res = await importTimetableCsv(badCsv);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("should detect missing fee fields in fees CSV", async () => {
    const badCsv = Buffer.from("rollNumber,totalFee\n2024CS101,55000");
    const res = await importFeesCsv(badCsv);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("should detect missing meal columns in mess menu CSV", async () => {
    const badCsv = Buffer.from("hostelBlock,dayOfWeek\nHostel-A,1");
    const res = await importMessMenuCsv(badCsv);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
