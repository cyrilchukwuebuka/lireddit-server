"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@mikro-orm/core");
require("reflect-metadata");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const express_session_1 = __importDefault(require("express-session"));
const apollo_server_core_1 = require("apollo-server-core");
const connect_redis_1 = __importDefault(require("connect-redis"));
const redis_1 = require("redis");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
let RedisStore = (0, connect_redis_1.default)(express_session_1.default);
let redisClient = (0, redis_1.createClient)({ legacyMode: true, });
redisClient.connect().catch(console.error);
const main = async () => {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    await orm.getMigrator().up;
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    const app = (0, express_1.default)();
    app.use((0, morgan_1.default)("common"));
    app.set("trust proxy", !(process.env.NODE_ENV === "production"));
    app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
    app.set("Access-Control-Allow-Credentials", true);
    app.use((0, cors_1.default)({
        credentials: true,
        origin: [
            "https://studio.apollographql.com",
            "http://localhost:4000/graphql",
        ],
    }));
    app.set("trust proxy", process.env.NODE_ENV !== "production");
    app.get("/", (_, response) => {
        response.send("Hello Server");
    });
    app.use((0, express_session_1.default)({
        name: "qid",
        store: new RedisStore({
            client: redisClient,
            disableTouch: true,
            host: "localhost",
            port: 6379,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: "none",
            secure: true,
        },
        saveUninitialized: false,
        secret: "keyboard cat",
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        plugins: [(0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)()],
        context: ({ req, res }) => ({
            em: orm.em,
            req: req,
            res,
        }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(4000, () => console.log(`\nServer started on localhost:4000\n`));
};
main().catch((err) => console.log(err));
//# sourceMappingURL=index.js.map