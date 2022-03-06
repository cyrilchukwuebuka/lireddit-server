import { loginDetails, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname, './migrations')
  },
  entities: [Post, User],
  dbName: "lireddit",
  user: loginDetails.user,
  password: loginDetails.password,
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];