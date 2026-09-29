import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../prisma.js";

export interface PredictionResult {
  category: "PLUMBING" | "ELECTRICAL" | "CARPENTRY" | "MASONRY" | "NETWORK_WIFI" | "HOUSEKEEPING" | "SECURITY" | "OTHER";
  confidence: number;
  matchedKeywords: string[];
}

interface TrainingDocument {
  text: string;
  category: string;
  tokens: string[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  PLUMBING: ["tap", "pipe", "drain", "water", "leak", "leaking", "washbasin", "sink", "flush", "shower", "geyser", "toilet", "faucet", "choked", "flooded", "bathroom"],
  ELECTRICAL: ["fan", "light", "bulb", "tube", "switch", "socket", "power", "plug", "mcb", "ac", "spark", "sparking", "flicker", "flickering", "current", "wire", "voltage", "cooling", "inverter"],
  CARPENTRY: ["door", "window", "cupboard", "bed", "chair", "table", "drawer", "lock", "latch", "hinge", "wood", "wooden", "handle", "wardrobe", "shelf", "shutter"],
  MASONRY: ["plaster", "wall", "ceiling", "tile", "crack", "damp", "seepage", "cement", "stairs", "brick", "floor", "grout", "roof", "pillar", "concrete"],
  NETWORK_WIFI: ["wifi", "wi-fi", "internet", "lan", "port", "router", "network", "speed", "dns", "ping", "packet", "signal", "connect", "connection", "intranet", "cable"],
  HOUSEKEEPING: ["clean", "cleaning", "garbage", "trash", "dustbin", "sweep", "swept", "dirty", "odor", "smell", "pest", "mosquito", "corridor", "washroom", "litter"],
  SECURITY: ["security", "gate", "guard", "thief", "theft", "stolen", "unauthorized", "strangers", "cctv", "camera", "fence", "turnstile", "curfew", "noise", "disturbance"],
  OTHER: ["lost", "found", "mattress", "general", "inquiry", "help", "staff", "office", "slip"]
};

export class ComplaintClassifier {
  private documents: TrainingDocument[] = [];
  private vocabulary: Set<string> = new Set();
  private idf: Map<string, number> = new Map();
  private isTrained: boolean = false;

  // Initialize and train from initial CSV and DB additions
  public async initialize(): Promise<void> {
    this.documents = [];
    this.vocabulary.clear();
    this.idf.clear();

    // 1. Read initial training CSV
    try {
      const candidates = [
        path.resolve(process.cwd(), "src", "data", "complaint_training.csv"),
        path.resolve(process.cwd(), "server", "src", "data", "complaint_training.csv")
      ];
      for (const csvPath of candidates) {
        if (fs.existsSync(csvPath)) {
          const fileContent = fs.readFileSync(csvPath, "utf-8");
          const records = parse(fileContent, { columns: true, skip_empty_lines: true }) as Array<{ text: string; category: string }>;
          for (const rec of records) {
            if (rec.text && rec.category) {
              this.addDocument(rec.text, rec.category.trim().toUpperCase());
            }
          }
          break;
        }
      }
    } catch (err) {
      console.warn("Could not read training CSV file:", err);
    }

    // 2. Load dynamic corrections from database if DB is reachable
    try {
      if (process.env.DATABASE_URL) {
        const dynamicData = await prisma.classifierTrainingData.findMany();
        for (const row of dynamicData) {
          this.addDocument(row.text, row.category.trim().toUpperCase());
        }
      }
    } catch {
      // Ignore if DB is not available in standalone unit test mode
    }

    this.computeIdf();
    this.isTrained = true;
  }

  // Tokenize and clean text
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  // Add document to training corpus
  public addDocument(text: string, category: string): void {
    const tokens = this.tokenize(text);
    this.documents.push({ text, category, tokens });
    tokens.forEach((t) => this.vocabulary.add(t));
  }

  // Calculate Inverse Document Frequency
  public computeIdf(): void {
    const totalDocs = this.documents.length;
    if (totalDocs === 0) return;

    for (const term of this.vocabulary) {
      const docCount = this.documents.filter((doc) => doc.tokens.includes(term)).length;
      this.idf.set(term, Math.log((totalDocs + 1) / (docCount + 1)) + 1);
    }
  }

  // Calculate TF-IDF vector for a set of tokens
  private getTfIdfVector(tokens: string[]): Map<string, number> {
    const termFreq = new Map<string, number>();
    tokens.forEach((t) => termFreq.set(t, (termFreq.get(t) || 0) + 1));

    const vector = new Map<string, number>();
    for (const [term, count] of termFreq.entries()) {
      const tf = count / tokens.length;
      const idf = this.idf.get(term) || 1.0;
      vector.set(term, tf * idf);
    }
    return vector;
  }

  // Cosine similarity between two sparse vectors
  private cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [, val] of vecA.entries()) normA += val * val;
    for (const [, val] of vecB.entries()) normB += val * val;

    if (normA === 0 || normB === 0) return 0;

    for (const [term, valA] of vecA.entries()) {
      const valB = vecB.get(term) || 0;
      dotProduct += valA * valB;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Classify a complaint description
  public classify(text: string): PredictionResult {
    if (!this.isTrained || this.documents.length === 0) {
      return this.keywordFallback(text);
    }

    const queryTokens = this.tokenize(text);
    if (queryTokens.length === 0) {
      return { category: "OTHER", confidence: 0.1, matchedKeywords: [] };
    }

    const queryVector = this.getTfIdfVector(queryTokens);
    const categoryScores: Record<string, { totalScore: number; count: number }> = {};
    const matchedKeywords: string[] = [];

    // Check direct domain keywords first (exact token match)
    for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of kws) {
        if (queryTokens.includes(kw)) {
          matchedKeywords.push(kw);
          if (!categoryScores[cat]) categoryScores[cat] = { totalScore: 0, count: 0 };
          categoryScores[cat].totalScore += 3.0;
          categoryScores[cat].count += 1;
        }
      }
    }

    // Compute similarity with each training document
    for (const doc of this.documents) {
      const docVector = this.getTfIdfVector(doc.tokens);
      const similarity = this.cosineSimilarity(queryVector, docVector);
      if (similarity > 0) {
        if (!categoryScores[doc.category]) {
          categoryScores[doc.category] = { totalScore: 0, count: 0 };
        }
        categoryScores[doc.category].totalScore += similarity * 2.0;
        categoryScores[doc.category].count += 1;
      }
    }

    // Pick category with highest composite score
    let bestCategory = "OTHER";
    let highestScore = 0;

    for (const [category, data] of Object.entries(categoryScores)) {
      if (data.totalScore > highestScore) {
        highestScore = data.totalScore;
        bestCategory = category;
      }
    }

    const confidence = Math.min(0.98, Math.max(0.35, highestScore / 4.0));

    return {
      category: (bestCategory as PredictionResult["category"]) || "OTHER",
      confidence: Number(confidence.toFixed(2)),
      matchedKeywords: Array.from(new Set(matchedKeywords))
    };
  }

  // Save staff correction to training database and live classifier memory
  public async learnCorrection(text: string, correctCategory: string): Promise<void> {
    const formattedCat = correctCategory.toUpperCase();
    this.addDocument(text, formattedCat);
    this.computeIdf();

    try {
      if (process.env.DATABASE_URL) {
        await prisma.classifierTrainingData.create({
          data: {
            text,
            category: formattedCat,
            source: "CORRECTION"
          }
        });
      }
    } catch {
      // Handled gracefully if DB not active during test
    }
  }

  private keywordFallback(text: string): PredictionResult {
    const tokens = this.tokenize(text);
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (tokens.includes(kw)) {
          return {
            category: cat as PredictionResult["category"],
            confidence: 0.85,
            matchedKeywords: [kw]
          };
        }
      }
    }
    return { category: "OTHER", confidence: 0.4, matchedKeywords: [] };
  }
}

export const classifierService = new ComplaintClassifier();
