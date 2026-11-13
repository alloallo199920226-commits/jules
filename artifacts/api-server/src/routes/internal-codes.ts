import { Router } from "express";
import { IssueInternalCodeBody, VerifyInternalCodeBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { issuePersistentCode, consumePersistentCode } from "../lib/persistent-codes";
import { getSession } from "../lib/account-session";
import { withinLimit } from "../lib/account-rate-limits";

const router = Router();
router.use("/internal-codes", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.post("/internal-codes", async (req, res) => {
  const input = IssueInternalCodeBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Pays ou numéro invalide." });
    return;
  }
  const { country, phone, purpose = "registration" } = input.data;
  if (phone.length > (country === "FR" ? 13 : 12)) {
    res.status(400).json({ error: "Numéro trop long pour le pays sélectionné." }); return;
  }
  const session = purpose !== "registration" ? await getSession(req) : null;
  if (purpose !== "registration") {
    if (!session) { res.status(401).json({ error: "Connectez-vous pour définir le mot de passe de transaction." }); return; }
    if (purpose === "transaction" && session.account.transactionPasswordHash) { res.status(409).json({ error: "Configuration déjà terminée." }); return; }
    if (purpose === "transaction-change" && !session.account.transactionPasswordHash) { res.status(409).json({ error: "Définissez d’abord le mot de passe de transaction." }); return; }
    if (session.account.country !== country || session.account.phone !== phone) {
      res.status(400).json({ error: "Le numéro doit correspondre au compte connecté." }); return;
    }
  }
  if (!(await withinLimit(`code-ip:${req.ip}`, 100, 600_000)) ||
      !(await withinLimit(`code-phone:${country}:${phone}:${purpose}`, 10, 600_000))) {
    res.status(429).json({ error: "Trop de demandes. Réessayez dans quelques minutes." }); return;
  }
  const code = await issuePersistentCode(country, phone, purpose,
    session ? { accountId: session.account.id, sessionHash: session.sessionHash } : undefined);
  res.json(code);
});

router.post("/internal-codes/verify", async (req, res) => {
  const input = VerifyInternalCodeBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Code interne invalide : six chiffres attendus." });
    return;
  }
  // This legacy check cannot complete onboarding or create a session.
  const result = await db.transaction((tx) => consumePersistentCode(tx, input.data, "registration"));
  if (result) { res.status(result.status).json({ error: result.error }); return; }
  res.json({ verified: true, accountCreated: false });
});

export default router;
