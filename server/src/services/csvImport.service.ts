import { parse } from "csv-parse/sync";
import argon2 from "argon2";
import { prisma } from "../prisma.js";

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: string[];
}

// Import students CSV
export async function importStudentsCsv(csvBuffer: Buffer): Promise<ImportResult> {
  const errors: string[] = [];
  let importedCount = 0;
  let rows: any[] = [];

  try {
    rows = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err: any) {
    return { success: false, totalRows: 0, importedCount: 0, errors: [`Invalid CSV format: ${err.message}`] };
  }

  const defaultPasswordHash = await argon2.hash("Password@123");

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const lineNum = idx + 2;

    if (!row.rollNumber || !row.fullName || !row.email || !row.phone) {
      errors.push(`Row ${lineNum}: Missing required fields (rollNumber, fullName, email, phone).`);
      continue;
    }

    try {
      await prisma.user.upsert({
        where: { email: row.email.toLowerCase() },
        update: {
          fullName: row.fullName,
          phone: row.phone,
          rollNumber: row.rollNumber.toUpperCase(),
          hostelBlock: row.hostelBlock || "Hostel-A",
          roomNumber: row.roomNumber || "General",
          branch: row.branch || "CSE",
          year: row.year ? parseInt(row.year, 10) : 1,
          batch: row.batch || "2024"
        },
        create: {
          email: row.email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          fullName: row.fullName,
          role: "STUDENT",
          phone: row.phone,
          rollNumber: row.rollNumber.toUpperCase(),
          hostelBlock: row.hostelBlock || "Hostel-A",
          roomNumber: row.roomNumber || "General",
          branch: row.branch || "CSE",
          year: row.year ? parseInt(row.year, 10) : 1,
          batch: row.batch || "2024"
        }
      });
      importedCount++;
    } catch (err: any) {
      errors.push(`Row ${lineNum} (${row.rollNumber}): Database error - ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    importedCount,
    errors
  };
}

// Import timetable CSV
export async function importTimetableCsv(csvBuffer: Buffer): Promise<ImportResult> {
  const errors: string[] = [];
  let importedCount = 0;
  let rows: any[] = [];

  try {
    rows = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err: any) {
    return { success: false, totalRows: 0, importedCount: 0, errors: [`Invalid CSV format: ${err.message}`] };
  }

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const lineNum = idx + 2;

    if (!row.branch || !row.year || !row.subjectCode || !row.subjectName || !row.dayOfWeek || !row.startTime || !row.endTime) {
      errors.push(`Row ${lineNum}: Missing required schedule fields.`);
      continue;
    }

    try {
      await prisma.courseSchedule.create({
        data: {
          branch: row.branch.toUpperCase(),
          year: parseInt(row.year, 10),
          batch: row.batch || null,
          subjectCode: row.subjectCode.toUpperCase(),
          subjectName: row.subjectName,
          facultyName: row.facultyName || "Department Faculty",
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
          room: row.room || "Room-101"
        }
      });
      importedCount++;
    } catch (err: any) {
      errors.push(`Row ${lineNum}: ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    importedCount,
    errors
  };
}

// Import fees CSV
export async function importFeesCsv(csvBuffer: Buffer): Promise<ImportResult> {
  const errors: string[] = [];
  let importedCount = 0;
  let rows: any[] = [];

  try {
    rows = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err: any) {
    return { success: false, totalRows: 0, importedCount: 0, errors: [`Invalid CSV format: ${err.message}`] };
  }

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const lineNum = idx + 2;

    if (!row.rollNumber || !row.studentName || row.totalFee === undefined || row.paidFee === undefined) {
      errors.push(`Row ${lineNum}: Missing fee details for roll number.`);
      continue;
    }

    const total = parseFloat(row.totalFee);
    const paid = parseFloat(row.paidFee);
    const due = row.dueFee !== undefined ? parseFloat(row.dueFee) : Math.max(0, total - paid);
    const semester = row.semester ? parseInt(row.semester, 10) : 1;
    const academicYear = row.academicYear || "2025-26";
    const dueDate = row.dueDate ? new Date(row.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let status: "PAID" | "PARTIAL" | "DUE" | "OVERDUE" = "DUE";
    if (due <= 0) {
      status = "PAID";
    } else if (paid > 0 && due > 0) {
      status = "PARTIAL";
    } else if (new Date() > dueDate) {
      status = "OVERDUE";
    }

    try {
      await prisma.feeRecord.upsert({
        where: {
          rollNumber_semester_academicYear: {
            rollNumber: row.rollNumber.toUpperCase(),
            semester,
            academicYear
          }
        },
        update: {
          studentName: row.studentName,
          totalFee: total,
          paidFee: paid,
          dueFee: due,
          dueDate,
          status,
          importedAt: new Date()
        },
        create: {
          rollNumber: row.rollNumber.toUpperCase(),
          studentName: row.studentName,
          totalFee: total,
          paidFee: paid,
          dueFee: due,
          dueDate,
          semester,
          academicYear,
          status,
          importedAt: new Date()
        }
      });
      importedCount++;
    } catch (err: any) {
      errors.push(`Row ${lineNum} (${row.rollNumber}): ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    importedCount,
    errors
  };
}

// Import mess menu CSV
export async function importMessMenuCsv(csvBuffer: Buffer): Promise<ImportResult> {
  const errors: string[] = [];
  let importedCount = 0;
  let rows: any[] = [];

  try {
    rows = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err: any) {
    return { success: false, totalRows: 0, importedCount: 0, errors: [`Invalid CSV format: ${err.message}`] };
  }

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const lineNum = idx + 2;

    if (!row.hostelBlock || !row.dayOfWeek || !row.breakfast || !row.lunch) {
      errors.push(`Row ${lineNum}: Missing menu meals or day.`);
      continue;
    }

    const day = parseInt(row.dayOfWeek, 10);
    try {
      await prisma.messMenu.upsert({
        where: {
          hostelBlock_dayOfWeek: {
            hostelBlock: row.hostelBlock,
            dayOfWeek: day
          }
        },
        update: {
          breakfast: row.breakfast,
          lunch: row.lunch,
          snacks: row.snacks || "Tea & Biscuits",
          dinner: row.dinner || "Roti & Sabzi",
          updatedAt: new Date()
        },
        create: {
          hostelBlock: row.hostelBlock,
          dayOfWeek: day,
          breakfast: row.breakfast,
          lunch: row.lunch,
          snacks: row.snacks || "Tea & Biscuits",
          dinner: row.dinner || "Roti & Sabzi"
        }
      });
      importedCount++;
    } catch (err: any) {
      errors.push(`Row ${lineNum}: ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    importedCount,
    errors
  };
}
