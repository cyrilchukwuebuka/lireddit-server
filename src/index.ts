import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
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
import connectRedis from "connect-redis";
import { createClient } from "redis";
import { MyContext } from "./types";
import morgan from "morgan";
import cors from "cors";
// import { request as sendMail } from "./utils/sendEmail";

let RedisStore = connectRedis(session);
let redisClient = createClient({legacyMode: true, });
redisClient.connect().catch(console.error);

const main = async () => {
  // dotenv.config();
  // await sendEmail('bob@bob.com', "Hello there")
  // sendMail
  //   .then((result) => {
  //     console.log(result.body);
  //   })
  //   .catch((err) => {
  //     console.log(err.statusCode);
  //   });
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up;

  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();

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
        client: redisClient as any,
        disableTouch: true,
        host: "localhost",
        port: 6379,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "none",
        secure: __prod__, // cookie when true only works in https
      },
      saveUninitialized: false,
      secret: "kq7y9q2039ry97ehpx7d30323",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
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
