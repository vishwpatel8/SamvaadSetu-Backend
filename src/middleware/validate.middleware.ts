import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        errors: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    req.body = validationResult.data;

    next();
  };

export default validate;
