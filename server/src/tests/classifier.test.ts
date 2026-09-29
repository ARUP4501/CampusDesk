import { describe, it, expect, beforeAll } from "vitest";
import { ComplaintClassifier } from "../services/classifier.service.js";
import { parseAndExecuteCommand } from "../services/commandParser.service.js";

describe("Complaint Classifier and Text Router", () => {
  let classifier: ComplaintClassifier;

  beforeAll(async () => {
    classifier = new ComplaintClassifier();
    await classifier.initialize();
  });

  it("should classify plumbing issues accurately", () => {
    const result = classifier.classify("water leaking continuously from washroom tap");
    expect(result.category).toBe("PLUMBING");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("should classify electrical issues accurately", () => {
    const result = classifier.classify("ceiling fan making clicking sound regulator not working");
    expect(result.category).toBe("ELECTRICAL");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("should classify carpentry issues accurately", () => {
    const result = classifier.classify("room door lock broken wooden latch not catching");
    expect(result.category).toBe("CARPENTRY");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("should classify network and wi-fi issues accurately", () => {
    const result = classifier.classify("wifi signal dropping in corridor router offline");
    expect(result.category).toBe("NETWORK_WIFI");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("should classify housekeeping issues accurately", () => {
    const result = classifier.classify("dustbin not cleared overflowing trash in corridor");
    expect(result.category).toBe("HOUSEKEEPING");
  });

  it("should adapt when learning staff corrections", async () => {
    await classifier.learnCorrection("strange hum near inverter", "ELECTRICAL");
    const result = classifier.classify("strange hum near inverter");
    expect(result.category).toBe("ELECTRICAL");
  });
});

describe("In-App Text Command Parser", () => {
  it("should parse HELP command", async () => {
    const res = await parseAndExecuteCommand("HELP");
    expect(res.success).toBe(true);
    expect(res.message).toContain("CampusDesk Text Command Console");
  });

  it("should reject invalid command gracefully", async () => {
    const res = await parseAndExecuteCommand("INVALID_VERB_XYZ");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Unknown command");
  });

  it("should handle STATUS validation error when ID is missing", async () => {
    const res = await parseAndExecuteCommand("STATUS");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Please provide a ticket or pass number");
  });
});
