import express from "express";
import cors from "cors";
import helmet from "helmet";
import { seedSuperAdmin } from "./controllers/userControllers.js";
import { runBillingMigration, seedDrugServices } from "../migrate.js";
import { loadICD } from "./icd/services/icd.services.js";
import apiRoutes from "./routes/index.js";
import { startJobs } from "./jobs/index.js";
import { applyStorageConfig } from "./lib/cloudinary-config.js";

import cookieParser from 'cookie-parser';

import { createServer } from "http";
//SOCKETS
import { Server as IOServer } from "socket.io";

import config from "./constants/config.js";

const app = express();

const port = config.app.port;

app.use(cookieParser());
app.use(helmet());

const FRONTEND = config.app.frontend;
const allowedOrigins = [
  FRONTEND,
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const httpServer = createServer(app);

// Initialize Socket.IO on that server
const io = new IOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Stored io instance 
app.set("socketio", io); // lets any controller do req.app.get("socketio")

//api routes
app.use("/", apiRoutes);

// seed superadmin then start listening on the HTTP server
runBillingMigration().then(() => seedDrugServices()).then(() => seedSuperAdmin()).then(async () => {
  loadICD();
  await applyStorageConfig();
  await startJobs(io);
  httpServer.listen(port, '0.0.0.0', () =>
    console.log(`Server + Socket.IO running on port ${port}`)
  );
}).catch((err) => {
  console.error("Error seeding superadmin:", err);
  // process.exit(1);
});

app.get("/", (_req, res) => {
  res.send("<h1>API dey run</h1>");
});
