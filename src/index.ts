import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import session from "express-session";
import Redis from 'ioredis';
import morgan from "morgan";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from 'typeorm';
import { COOKIE_NAME, __prod__ } from "./constants";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { typeormConfig } from "./typeormConfig";
import { MyContext } from "./types";

dotenv.config();

const main = async () => {
  let RedisStore = connectRedis(session);
  let redis = new Redis();
  redis.connect().catch(console.error);

  const conn = await createConnection(typeormConfig);
  await conn.runMigrations()

  const app = express();

  app.use(morgan("common"));
  app.set("trust proxy", !(process.env.NODE_ENV === "production"));

  app.use(
    cors({
      credentials: true,
      origin: [
        "https://studio.apollographql.com",
        "http://localhost:4000/graphql",
        "http://localhost:3000",
      ],
    })
  );

  app.set("trust proxy", process.env.NODE_ENV !== "production");

  app.get("/", (_, response) => {
    response.send("Hello Server");
  });

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis as any,
        disableTouch: true,
        host: "localhost",
        port: 6379,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__, // cookie when true only works in https
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || '',
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req: req as any,
      res,
      redis,
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => console.log(`\nServer started on localhost:4000\n`));
};

main().catch((err) => console.log(err));
