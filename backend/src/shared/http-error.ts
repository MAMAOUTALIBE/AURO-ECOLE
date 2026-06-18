export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "HTTP_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function notFound(message = "Ressource introuvable") {
  return new HttpError(404, message, "NOT_FOUND");
}

export function forbidden(message = "Accès refusé") {
  return new HttpError(403, message, "FORBIDDEN");
}

export function unauthorized(message = "Authentification requise") {
  return new HttpError(401, message, "UNAUTHORIZED");
}

export function conflict(message = "Conflit de ressource") {
  return new HttpError(409, message, "CONFLICT");
}

export function badRequest(message = "Requête invalide") {
  return new HttpError(400, message, "BAD_REQUEST");
}
