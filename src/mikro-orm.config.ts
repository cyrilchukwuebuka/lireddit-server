import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";

export default {
  migrations: {
    path: path.join(__dirname, './migrations')
  },
  entities: [Post],
  dbName: "lireddit",
  user: 'postgres',
  password: 'chukwuebuka1999',
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];