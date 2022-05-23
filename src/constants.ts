import * as dotenv from "dotenv";

dotenv.config();

export const __prod__ = process.env.NODE_ENV === "production";
export const loginDetails = {
  user: process.env.POSTGRES_DBNAME || "",
  password: process.env.POSTGRES_PASSWORD || ""
};

export const COOKIE_NAME = "qid";
export const FORGET_PASSWORD_PREFIX = "forget-password:";
