import "../../support/test-env.ts";

import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";

function isRequestHandler(value: unknown): value is Parameters<typeof createServer>[0] {
  return typeof value === "function";
}

export async function startHttpServer(app: unknown): Promise<Server> {
  if (!isRequestHandler(app)) {
    throw new Error("The HTTP test server requires a valid request handler.");
  }

  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.listen(0, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  return server;
}

export async function stopHttpServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

type JsonRequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "OPTIONS";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

type MultipartRequestOptions = {
  method: "POST" | "PATCH";
  path: string;
  headers?: Record<string, string>;
  fields?: Record<string, string>;
  file?: {
    fieldName: string;
    fileName: string;
    contentType: string;
    bytes: Uint8Array;
  };
};

export async function requestJson(server: Server, options: JsonRequestOptions) {
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("The HTTP test server did not expose a numeric port.");
  }

  const { port } = address as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}${options.path}`, {
    method: options.method,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const parsedBody = rawBody && contentType.includes("application/json")
    ? JSON.parse(rawBody)
    : null;

  return {
    status: response.status,
    body: parsedBody,
    headers: response.headers,
    rawBody,
  };
}

export async function requestMultipart(server: Server, options: MultipartRequestOptions) {
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("The HTTP test server did not expose a numeric port.");
  }

  const { port } = address as AddressInfo;
  const formData = new FormData();

  for (const [fieldName, fieldValue] of Object.entries(options.fields ?? {})) {
    formData.append(fieldName, fieldValue);
  }

  if (options.file) {
    formData.append(
      options.file.fieldName,
      new File([Buffer.from(options.file.bytes)], options.file.fileName, {
        type: options.file.contentType,
      }),
    );
  }

  const response = await fetch(`http://127.0.0.1:${port}${options.path}`, {
    method: options.method,
    headers: options.headers,
    body: formData,
  });

  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const parsedBody = rawBody && contentType.includes("application/json")
    ? JSON.parse(rawBody)
    : null;

  return {
    status: response.status,
    body: parsedBody,
    headers: response.headers,
    rawBody,
  };
}
