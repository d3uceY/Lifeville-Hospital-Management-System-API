import jwt from "jsonwebtoken";
import config from "../constants/config.js";

export async function authenticate(req, res, next) {
  const auth = req.headers.authorization?.split(" ");
  // console.log("Auth Header:", req.headers.authorization);
  if (auth?.[0] === "Bearer" && auth[1]) {
    try {
      const payload = jwt.verify(auth[1], config.auth.jwtAccessKey);
      req.userId = payload.sub;
      req.userRole = payload.role;
      req.userCreatedAt = payload.createdAt;
      return next();
    } catch {
      return res.sendStatus(401);
    }
  }
  return res.sendStatus(401);
}
