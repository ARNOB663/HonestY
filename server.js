// Passenger entrypoint for cPanel / BDIX Node.js Selector.
//
// cPanel's Phusion Passenger runs this file (named in the Node.js app's
// "Application startup file" field) instead of `next start`. It wraps Next
// in a plain Node HTTP server so Passenger can manage the process, set
// $PORT, and handle restarts via the cPanel "Restart" button.
//
// Locally you still use `npm run dev` / `npm start` — this file is only
// touched in production on cPanel. ESM because package.json has type:module.

import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> HonestY ready on port ${port} (NODE_ENV=${process.env.NODE_ENV})`);
  });
}).catch((err) => {
  console.error("Next.js failed to start:", err);
  process.exit(1);
});
