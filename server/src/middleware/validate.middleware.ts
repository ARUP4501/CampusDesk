import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Request body validation middleware
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }));
        res.status(400).json({ error: "Validation failed", details: errors });
        return;
      }
      res.status(400).json({ error: "Invalid request data format." });
    }
  };
}

// Request query validation middleware
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }));
        res.status(400).json({ error: "Query validation failed", details: errors });
        return;
      }
      res.status(400).json({ error: "Invalid query parameters." });
    }
  };
}
