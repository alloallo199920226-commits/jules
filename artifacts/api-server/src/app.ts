import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.startsWith("/api/")
            ? req.url.split("?")[0].replace(/^(\/api\/console\/)[^/]+/, "$1[masqué]")
            : "/[page masquée]",
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
const safeError: ErrorRequestHandler = (_error, _req, res, _next) => {
  // Never log database parameters, passwords, code bodies or session cookies.
  logger.error("La requête API n’a pas pu être traitée.");
  res.status(500).json({ error: "Le serveur est indisponible. Veuillez réessayer." });
};
app.use(safeError);

export default app;
