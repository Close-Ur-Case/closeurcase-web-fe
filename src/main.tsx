import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { getRouter } from "./router";
import "./styles.css";
import "@/lib/pwaInstall";

const queryClient = new QueryClient();
const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No #root element found");

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
