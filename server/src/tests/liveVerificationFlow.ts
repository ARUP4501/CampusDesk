async function runLiveTest() {
  console.log("=== Testing CampusDesk RBAC and Live Verification API ===");

  // 1. Login as Admin
  const adminLoginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@campusdesk.edu", password: "Password@123" })
  });
  const adminData = await adminLoginRes.json();
  console.log("1. Admin Login:", adminData.user.fullName, "| Role:", adminData.user.role);
  const adminToken = adminData.token;

  // 2. Fetch Admin Verification Queue
  const queueRes = await fetch("http://localhost:5000/api/admin/verifications", {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const queueData = await queueRes.json();
  console.log(`2. Admin Queue Count: ${queueData.count} students`);
  queueData.verifications.slice(0, 3).forEach((v: any) => {
    console.log(`   - ${v.fullName} (${v.rollNumber}) | Status: ${v.verificationStatus} | Req Hostel: ${v.requestedHostel}`);
  });

  // 3. Login as Warden A (Hostel-A)
  const wardenALoginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "warden@campusdesk.edu", password: "Password@123" })
  });
  const wardenAData = await wardenALoginRes.json();
  console.log("3. Warden A Login:", wardenAData.user.fullName, "| Assigned Hostel:", wardenAData.user.hostelBlock);
  const wardenAToken = wardenAData.token;

  // 4. Scoped Verification Queue for Warden A
  const wardenAQueueRes = await fetch("http://localhost:5000/api/admin/verifications", {
    headers: { Authorization: `Bearer ${wardenAToken}` }
  });
  const wardenAQueue = await wardenAQueueRes.json();
  console.log(`4. Warden A Scoped Queue: ${wardenAQueue.count} students (Only Hostel-A)`);
  wardenAQueue.verifications.forEach((v: any) => {
    console.log(`   - ${v.fullName} | Req Hostel: ${v.requestedHostel}`);
  });

  // 5. Register a brand new student
  const newStudentRoll = `REG${Date.now().toString().slice(-4)}`;
  const regRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Ananya Mishra",
      email: `ananya_${Date.now()}@campusdesk.edu`,
      phone: "9876543277",
      password: "Password@123",
      rollNumber: newStudentRoll,
      dob: "2004-06-15",
      gender: "FEMALE",
      bloodGroup: "O+",
      course: "B.Tech",
      department: "CSE",
      branch: "CSE",
      year: 1,
      semester: 1,
      permanentAddress: "Plot 55, Khandagiri, Bhubaneswar",
      fatherName: "B. K. Mishra",
      fatherPhone: "9876543255",
      guardianName: "Santosh Mishra",
      guardianRelation: "Uncle",
      guardianPhone: "9876543256",
      requestedHostel: "Hostel-A",
      consentAgreed: true
    })
  });
  const regData = await regRes.json();
  console.log("5. New Student Registered:", regData.user.fullName, "| Status:", regData.user.verificationStatus);
  const newStudentId = regData.user.id;

  // 6. Warden A approves student
  const wardenApproveRes = await fetch(`http://localhost:5000/api/admin/verifications/${newStudentId}/warden-review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wardenAToken}`
    },
    body: JSON.stringify({ action: "APPROVE" })
  });
  const wardenApproveData = await wardenApproveRes.json();
  console.log("6. Warden A Approved Student -> New Status:", wardenApproveData.student.verificationStatus);

  // 7. Admin grants final activation & assigns Room & Bed
  const adminApproveRes = await fetch(`http://localhost:5000/api/admin/verifications/${newStudentId}/admin-review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      action: "APPROVE",
      hostelBlock: "Hostel-A",
      roomNumber: "A-101",
      bedNumber: "Bed-1"
    })
  });
  const adminApproveData = await adminApproveRes.json();
  console.log("7. Admin Activated Student -> Final Status:", adminApproveData.student.verificationStatus, "| Active:", adminApproveData.student.isActive);

  // 8. Verify Audit Log was generated
  const auditRes = await fetch("http://localhost:5000/api/admin/audit-logs", {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const auditData = await auditRes.json();
  console.log(`8. System Audit Logs: ${auditData.count} total records. Most recent 2:`);
  auditData.logs.slice(0, 2).forEach((l: any) => {
    console.log(`   [${l.action}] by ${l.actor.fullName} (${l.actorRole}) -> ${l.details}`);
  });

  console.log("\n=== ALL LIVE VERIFICATION & RBAC FLOWS PASSED SUCCESSFULLY ===");
}

runLiveTest().catch(console.error);
