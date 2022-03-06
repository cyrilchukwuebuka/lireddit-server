import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import "reflect-metadata";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
// import * as dotenv from "dotenv";
import session from "express-session";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import connectRedis from "connect-redis";
import { createClient } from "redis";
import { MyContext } from "./types";
import morgan from "morgan";
import cors from "cors";

let RedisStore = connectRedis(session);
let redisClient = createClient({legacyMode: true, });
redisClient.connect().catch(console.error);

const main = async () => {
  // dotenv.config();
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up;

  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();

  const app = express();

  app.use(morgan("common"));
  app.set("trust proxy", !(process.env.NODE_ENV === "production"));
  app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
  app.set("Access-Control-Allow-Credentials", true);

  app.use(
    cors({
      credentials: true,
      origin: [
        "https://studio.apollographql.com",
        "http://localhost:4000/graphql",
      ],
    })
  );

  // console.log(process.env.NODE_ENV !== "production");
  app.set("trust proxy", process.env.NODE_ENV !== "production");

  app.get("/", (_, response) => {
    response.send("Hello Server");
  });

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient as any,
        disableTouch: true,
        host: "localhost",
        port: 6379,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "none",
        secure: true, // cookie only works in https 
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    context: ({ req, res }): MyContext => ({
      em: orm.em,
      req: req as any,
      res,
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => console.log(`\nServer started on localhost:4000\n`));
};

main().catch((err) => console.log(err));
