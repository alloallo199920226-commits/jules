import { Router, type RequestHandler } from "express";
import consoleHtml from "../assets/administration.html";
import { matchesConsoleEntry } from "../lib/console-entry";

const serveConsole: RequestHandler = async (req,res) => {
  res.set({
    "Cache-Control":"no-store, private",
    "X-Robots-Tag":"noindex, nofollow, noarchive",
    "Referrer-Policy":"no-referrer",
    "X-Content-Type-Options":"nosniff",
  });
  if (!await matchesConsoleEntry(String(req.params.entry))) {
    res.status(404).type("text").send("Page introuvable.");return;
  }
  res.type("html").send(consoleHtml);
};
const router = Router();
router.get("/console/:entry",serveConsole);
export default router;
