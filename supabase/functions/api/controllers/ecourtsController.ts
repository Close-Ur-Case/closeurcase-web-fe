import { Context } from "hono";
import { FakeEcourtsService } from "../services/fakeEcourtsService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getMockEcourtsCase(c: Context) {
  const cnrParam = c.req.param("cnr");
  const cnr = String(cnrParam || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!cnr || cnr.length !== 16) {
    throw ApiError.badRequest(
      `Invalid CNR number '${cnrParam}'. A valid eCourts CNR must be exactly 16 alphanumeric characters (e.g. APVK020004422026).`
    );
  }

  // Optional simulated delay to test async UI loaders
  const delayParam = c.req.query("delayMs");
  if (delayParam) {
    const delay = Math.min(2000, Math.max(0, parseInt(delayParam, 10) || 0));
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  try {
    const fullResponse = FakeEcourtsService.generateFullResponse(cnr);
    return c.json(fullResponse, 200);
  } catch (err: any) {
    throw ApiError.badRequest(err.message || "Failed to generate mock eCourts docket");
  }
}
