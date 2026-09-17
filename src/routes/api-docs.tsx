import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api-docs")({
  head: () => ({ meta: [{ title: "API Documentation (Swagger UI) — CloseUrCase" }] }),
  component: ApiDocsPage,
});

export function ApiDocsPage() {
  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <iframe
        src="/api-docs.html"
        title="CloseUrCase API Documentation — Swagger UI"
        className="w-full h-full border-0 flex-1"
      />
    </div>
  );
}
