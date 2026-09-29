import PDFDocument from "pdfkit";

export interface BonafideData {
  certificateNumber: string;
  studentName: string;
  rollNumber: string;
  branch: string;
  year: number;
  batch: string;
  purpose: string;
  issueDate: Date;
  collegeName?: string;
}

export interface TicketSlipData {
  ticketNumber: string;
  studentName: string;
  rollNumber: string;
  category: string;
  hostelBlock: string;
  roomNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: Date;
}

// Generate Bonafide Certificate PDF Buffer
export function generateBonafidePdf(data: BonafideData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Outer border
    doc.rect(20, 20, 555, 802).lineWidth(2).stroke("#0f4c3a");
    doc.rect(25, 25, 545, 792).lineWidth(0.5).stroke("#0f4c3a");

    // Header
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#0f4c3a").text("CAMPUSDESK INSTITUTION OF TECHNOLOGY", { align: "center" });
    doc.font("Helvetica").fontSize(10).fillColor("#4a5568").text("Office of Academic and Hostel Administration", { align: "center" });
    doc.text("Approved by AICTE and Affiliated to State Technological University", { align: "center" });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cbd5e1").lineWidth(1).stroke();
    doc.moveDown(2);

    // Document Title
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#1a1a1a").text("BONAFIDE CERTIFICATE", { align: "center" });
    doc.moveDown(1);

    // Reference and Date
    const yPos = doc.y;
    doc.font("Helvetica").fontSize(10).fillColor("#333333").text(`Ref No: ${data.certificateNumber}`, 50, yPos);
    doc.text(`Date: ${data.issueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 400, yPos, { align: "right" });
    doc.moveDown(3);

    // Body text
    const bodyText = `This is to certify that ${data.studentName}, bearing Roll Number ${data.rollNumber}, is a bonafide student of this institution, currently enrolled in Year ${data.year} of the B.Tech program in ${data.branch} (Batch ${data.batch}).\n\nThis certificate is issued upon the student's request for the specific purpose of: "${data.purpose}".\n\nAccording to college records, the student's academic standing and general conduct have been satisfactory.`;

    doc.font("Helvetica").fontSize(12).lineGap(6).fillColor("#1a1a1a").text(bodyText, 50, doc.y, {
      width: 495,
      align: "justify"
    });

    // Signature Area
    doc.moveDown(6);
    const signY = doc.y;
    doc.font("Helvetica").fontSize(10).fillColor("#666666");
    doc.text("System Verified Document", 50, signY);
    doc.text("CampusDesk Digital Verification ID: " + data.certificateNumber, 50, signY + 15);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a1a1a");
    doc.text("Authorized Signatory", 380, signY, { align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor("#666666");
    doc.text("Dean / Registrar Office", 380, signY + 15, { align: "right" });

    doc.end();
  });
}

// Generate Printable Ticket Slip PDF Buffer
export function generateTicketSlipPdf(data: TicketSlipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 30, layout: "portrait" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Outer border
    doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).lineWidth(1).stroke("#0f4c3a");

    // Header
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#0f4c3a").text("CAMPUSDESK MAINTENANCE TICKET SLIP", { align: "center" });
    doc.font("Helvetica").fontSize(9).fillColor("#555555").text("Hostel Office Physical Receipt", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(1);

    // Ticket Details Table
    const drawRow = (label: string, value: string) => {
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#333333").text(label, 30, y, { width: 120 });
      doc.font("Helvetica").fontSize(9).fillColor("#111111").text(value, 150, y, { width: 230 });
      doc.moveDown(0.6);
    };

    drawRow("Ticket Number:", data.ticketNumber);
    drawRow("Date / Time:", data.createdAt.toLocaleString());
    drawRow("Student Name:", data.studentName);
    drawRow("Roll Number:", data.rollNumber);
    drawRow("Hostel & Room:", `${data.hostelBlock}, Room ${data.roomNumber}`);
    drawRow("Category:", data.category);
    drawRow("Priority:", data.priority);
    drawRow("Initial Status:", data.status);
    drawRow("Issue Title:", data.title);
    drawRow("Description:", data.description);

    doc.moveDown(1);
    doc.rect(30, doc.y, doc.page.width - 60, 45).lineWidth(0.5).stroke("#cbd5e1");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#444444").text("STAFF ASSIGNMENT & RESOLUTION NOTE (Office Use Only):", 35, doc.y + 5);
    
    doc.moveDown(4);
    doc.font("Helvetica").fontSize(8).fillColor("#666666").text("Present this slip to the maintenance desk or track online at CampusDesk portal.", { align: "center" });

    doc.end();
  });
}
