export const validate =
  (schema, pick = "body") =>
  (req, res, next) => {
    const candidate =
      pick === "body" ? req.body :
      pick === "params" ? req.params :
      pick === "query" ? req.query :
      undefined;

    const result = schema.safeParse(candidate);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request", issues: result.error.issues });
    }

    // Do NOT assign back to req.query/req.params (read-only in Express 5)
    // Stash validated data on res.locals for controllers.
    if (!res.locals) res.locals = {};
    if (!res.locals.validated) res.locals.validated = {};
    res.locals.validated[pick] = result.data;

    // It's still fine to assign body (writable), but for consistency we won't.
    // If you *really* want, you could do: if (pick === "body") req.body = result.data;

    next();
  };
