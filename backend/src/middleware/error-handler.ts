import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../shared/http-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Données invalides",
        details: error.flatten()
      }
    });
  }

  // Corps JSON malformé (levé par express.json()) : c'est une erreur CLIENT (400),
  // pas une 500. body-parser pose toujours `type: "entity.parse.failed"`.
  if ((error as { type?: string })?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Corps de requête JSON invalide."
      }
    });
  }

  const message = error instanceof Error ? error.message : "Erreur serveur";
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "Erreur serveur" : message
    }
  });
};
