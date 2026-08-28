//transport HTTP (URL, timeout, erreurs)

// frontend/src/lib/api.ts
// Client HTTP unique : toute la communication avec FastAPI passe par ici.
// Aucun composant ne doit appeler fetch() directement.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  // Les variables NEXT_PUBLIC_* sont injectees au build : si elle manque,
  // autant echouer tout de suite avec un message clair plutot que de voir
  // des requetes partir vers "undefined/health".
  throw new Error(
    "NEXT_PUBLIC_API_URL est absente. Ajoute-la dans frontend/.env.local"
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = RequestInit & {
  /** Delai au-dela duquel la requete est annulee (defaut 8 s). */
  timeoutMs?: number;
};

export async function apiFetch<T>(
  path: string,
  { timeoutMs = 8_000, signal, headers, ...init }: ApiFetchOptions = {}
): Promise<T> {
  // AbortSignal.any combine le timeout et l'annulation venant du composant
  // (demontage React). Sans ca, une requete lente continue apres la
  // disparition du composant et provoque une mise a jour dans le vide.
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: combined,
      headers: { Accept: "application/json", ...headers },
    });
  } catch (error) {
    // Une annulation volontaire n'est pas une panne : on la laisse remonter
    // telle quelle pour que l'appelant puisse l'ignorer.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Impossible de joindre l'API. Est-elle demarree ?");
  }

  if (!response.ok) {
    // FastAPI renvoie ses erreurs sous la forme {"detail": "..."}.
    const detail = await response
      .json()
      .then((body) => body?.detail)
      .catch(() => null);
    throw new ApiError(detail ?? `Erreur HTTP ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}