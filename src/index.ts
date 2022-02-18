import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";
import express from 'express';
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
// import * as dotenv from "dotenv";

const main = async () => {
  // dotenv.config();
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up;
  
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
      validate: false
    })
  })

  await apolloServer.start();
  apolloServer.applyMiddleware({ app })
  
  app.listen(4000, () => console.log('server started on localhost:4000'))

  // the below commented codes does same task as the await orm.getMigrator().up;
  // const generator = orm.getSchemaGenerator();
  // await generator.updateSchema();

  // const post = orm.em.create(Post, { title: "My first post" });
  // await orm.em.persistAndFlush(post);

  // const posts = await orm.em.find(Post, {})
  // console.log(posts)
};

main().catch((err) => console.log(err));