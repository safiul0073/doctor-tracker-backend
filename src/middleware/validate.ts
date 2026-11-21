import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { badRequestError } from "../utils/errors.js";

interface ValidateSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.assign(req.query, parsedQuery);
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(badRequestError("Validation failed", formatted));
      }
      return next(error);
    }
  };
}
