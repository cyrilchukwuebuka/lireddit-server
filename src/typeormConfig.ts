import path from "path";
import { loginDetails } from "./constants";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";
import { User } from "./entities/User";

export const typeormConfig = {
  type: "postgres",
  database: "lireddit2",
  username: loginDetails.user,
  password: loginDetails.password,
  logging: "all",
  synchronize: true,
  entities: [Post, User, Updoot],
  migrationsTableName: "FakePosts",
  migrations: [path.join(__dirname, "./migrations/*")],
  cli: {
    entitiesDir: "./src/entities",
    migrationsDir: "./src/migrations",
  },
} as any;