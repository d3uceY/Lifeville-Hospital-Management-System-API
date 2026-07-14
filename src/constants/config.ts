import env from "dotenv";
env.config();

const config = {
  db: {
    url: process.env.DATABASE_URL as string,
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
  },
  auth: {
    jwtAccessKey: process.env.JWT_ACCESS_KEY as string,
    jwtRefreshKey: process.env.JWT_REFRESH_KEY as string,
    accessExpires: process.env.ACCESS_EXPIRES || "30m",
    refreshExpires: process.env.REFRESH_EXPIRES || "30d",
    saltRounds: parseInt(process.env.SALT_ROUNDS ?? "12") || 12,
  },
  superAdmin: {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
  },
  // cloudinary: {
  //   cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  //   apiKey: process.env.CLOUDINARY_API_KEY,
  //   apiSecret: process.env.CLOUDINARY_API_SECRET,
  // },
  app: {
    port: process.env.PORT || 3000,
    frontend: process.env.FRONTEND || "http://localhost:5173",
    production: process.env.PRODUCTION === "true",
  },
  // smtp: {
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT) || 587,
  //   secure: process.env.SMTP_SECURE === "true",
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASS,
  //   from: process.env.SMTP_FROM || process.env.SMTP_USER,
  // },
  passwordReset: {
    tokenExpiryMs: parseInt(process.env.PASSWORD_RESET_EXPIRY_MS ?? "3600000") || 60 * 60 * 1000, // 1 hour default
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY,
  },
  icd: {
    icdTextName: process.env.ICD_TEXT_NAME || "icd10cm_codes.txt",
  },
  seed: {
    seedDrugServices: process.env.SEED_DRUG_SERVICES,
  },
};

export default config;
