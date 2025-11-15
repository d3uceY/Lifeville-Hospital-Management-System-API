import express from "express";
import cors from "cors";
import env from "dotenv";
import { seedSuperAdmin } from "./controllers/userControllers.js";
import apiRoutes from "./routes/index.js";

import cookieParser from 'cookie-parser';

import { createServer } from "http";
//SOCKETS
import { Server as IOServer } from "socket.io";

import { specs, swaggerUiOptions as swaggerUi } from "./swagger/swagger.js";

env.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(cookieParser());

const FRONTEND = process.env.FRONTEND || "http://localhost:5173";
const allowedOrigins = [
  FRONTEND,
  "http://localhost:5173",
  "http://10.101.159.69:5173"
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: { persistAuthorization: true },
  })
);

// seed superadmin then start listening on the HTTP server
seedSuperAdmin().then(() => {
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
