import { Router, type IRouter } from "express";
import healthRouter from "./health";
import internalCodesRouter from "./internal-codes";
import accountsRouter from "./accounts";
import memberRouter from "./member";
import memberSettingsRouter from "./member-settings";
import administrationRouter from "./administration";
import moderationRouter from "./moderation";
import supportRouter from "./support";
import communityActionsRouter from "./community-actions";
import { DomainError } from "../lib/administration";
import consoleEntryRouter from "./console-entry";

const router: IRouter = Router();

router.use(healthRouter);
router.use(consoleEntryRouter);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("sec-fetch-site") === "cross-site" || !req.is("application/json"))) {
    res.status(403).json({ error: "Requête non autorisée." });
    return;
  }
  next();
});
router.use(internalCodesRouter);
router.use(accountsRouter);
router.use(memberRouter);
router.use(memberSettingsRouter);
router.use(moderationRouter);
router.use(supportRouter);
router.use(communityActionsRouter);
router.use(administrationRouter);
router.use((error: unknown, _req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  if (error instanceof DomainError) { res.status(error.status).json({ error: error.message }); return; }
  next(error);
});

export default router;
