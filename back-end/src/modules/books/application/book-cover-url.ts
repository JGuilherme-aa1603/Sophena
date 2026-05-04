import { ValidationError } from "../../auth/application/auth-errors.ts";

type ValidationIssue = { field: string; message: string };

export function parseManagedBookCoverUrl(
  coverUrl: unknown,
  errors: ValidationIssue[],
) {
  if (coverUrl === undefined || coverUrl === null) {
    return null;
  }

  if (typeof coverUrl !== "string") {
    errors.push({
      field: "cover_url",
      message: "cover_url must be a string, null, or undefined",
    });
    return null;
  }

  const trimmedCoverUrl = coverUrl.trim();

  if (trimmedCoverUrl.length === 0) {
    return null;
  }

  if (!isManagedBookCoverUrl(trimmedCoverUrl)) {
    errors.push({
      field: "cover_url",
      message: "cover_url must be a managed book cover URL",
    });
    return null;
  }

  return trimmedCoverUrl;
}

function isManagedBookCoverUrl(coverUrl: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return false;
  }

  const managedBookCoverPrefix = `${removeTrailingSlash(publicBaseUrl)}/book-covers/`;
  return coverUrl.startsWith(managedBookCoverPrefix)
    && coverUrl.length > managedBookCoverPrefix.length;
}

function removeTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
