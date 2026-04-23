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
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
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
  const parsedBody = rawBody ? JSON.parse(rawBody) : null;

  return {
    status: response.status,
    body: parsedBody,
    headers: response.headers,
  };
}
