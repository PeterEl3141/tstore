import express from "express";
// (Optional) later: import axios from "axios";

const router = express.Router();

// Simple denylist to avoid impossible shipments.
// Later, replace or augment with a Gelato shipment-methods check.
const SANCTIONED = new Set(["CU","IR","KP","SY","SD","SS","RU","BY"]); // adjust as needed

router.get("/eligibility", async (req, res) => {
  const country = String(req.query.country || "").toUpperCase();
  if (!country || country.length !== 2) {
    return res.status(400).json({ eligible: false, reason: "invalid_country" });
  }
  if (SANCTIONED.has(country)) {
    return res.json({ eligible: false, reason: "sanctioned" });
  }

  // TODO (optional): Live check with Gelato shipment methods API for the country.
  // try {
  //   const { data } = await axios.get("https://shipment.gelatoapis.com/v1/shipment-methods", {
  //     headers: { "X-API-KEY": process.env.GELATO_API_KEY },
  //     params: { country } // if their API supports filtering
  //   });
  //   const methods = Array.isArray(data) ? data.filter(m => m?.destinationCountryCode === country) : [];
  //   return res.json({ eligible: methods.length > 0, methods });
  // } catch (e) {
  //   console.error("gelato eligibility error", e?.response?.data || e.message);
  //   return res.status(502).json({ eligible: false, reason: "gelato_unavailable" });
  // }

  // Default: permitted
  res.json({ eligible: true });
});

export default router;
