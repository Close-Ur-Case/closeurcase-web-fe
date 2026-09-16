import { Hono } from "hono";
import {
  getCategories,
  getCities,
  getDistricts,
  getCourts,
  getLanguages,
  getStates,
  getCourtLevels,
  createTaxonomyItem,
  updateTaxonomyItem,
  deleteTaxonomyItem,
} from "../controllers/masterDataController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const masterData = new Hono();

masterData.get("/categories", optionalAuth, getCategories);
masterData.get("/cities", optionalAuth, getCities);
masterData.get("/districts", optionalAuth, getDistricts);
masterData.get("/courts", optionalAuth, getCourts);
masterData.get("/languages", optionalAuth, getLanguages);
masterData.get("/states", optionalAuth, getStates);
masterData.get("/court-levels", optionalAuth, getCourtLevels);

// Admin Taxonomy Management CRUD
masterData.post("/:type", optionalAuth, createTaxonomyItem);
masterData.put("/:type/:id", optionalAuth, updateTaxonomyItem);
masterData.delete("/:type/:id", optionalAuth, deleteTaxonomyItem);

export default masterData;

