import env from "dotenv";
env.config();

const config = {
  db: {
    url: process.env.DATABASE_URL,
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
  },
  auth: {
    jwtAccessKey: process.env.JWT_ACCESS_KEY,
    jwtRefreshKey: process.env.JWT_REFRESH_KEY,
    accessExpires: process.env.ACCESS_EXPIRES || "30m",
    refreshExpires: process.env.REFRESH_EXPIRES || "30d",
    saltRounds: parseInt(process.env.SALT_ROUNDS) || 12,
  },
  superAdmin: {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  app: {
    port: process.env.PORT || 3000,
    frontend: process.env.FRONTEND || "http://localhost:5173",
    production: process.env.PRODUCTION === "true",
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY,
  }
};

export default config;
