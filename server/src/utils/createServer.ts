import { buildSchema } from "type-graphql";
import UserResolver from "../modules/message/user/user.resolver";
import { ApolloServer } from "apollo-server-fastify";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { SubscriptionServer } from "subscriptions-transport-ws";
import fastify, { FastifyInstance, FastifyRequest } from "fastify";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";

import { GraphQLSchema, execute, subscribe } from "graphql";

const app = fastify();

app.register(fastifyCors, {
  credentials: true,
  origin: (origin, cb) => {
    if (
      ["http://localhost:3000", "https://studio.apollographql.com"].includes(
        origin
      )
    ) {
      return cb(null, true);
    }
    return cb(new Error("not allowed"), false);
  },
});

app.register(fastifyCookie, {
  parseOptions: {},
});

app.register(fastifyJwt, {
  secret: "change-me",
  cookie: {
    cookieName: "token",
    signed: false,
  },
});

async function buildContext({
  request,
  reply,
  connectionParams,
}: {
  request?: FastifyRequest;
  reply?: FastifyRequest;
  connectionParams?: {
    Authorization: string;
  };
}) {
  if (connectionParams || !request) {
    try {
      return {
        user: await app.jwt.verify(connectionParams?.Authorization || ""),
      };
    } catch (e) {
      return { user: null };
    }
  }
  try {
    const user = await request.jwtVerify();
    return { request, reply, UserResolver };
  } catch (e) {
    return { request, reply, user: null };
  }
}

function fastifyAppClosePlugin(app: FastifyInstance): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async drainServer() {
          app.close();
        },
      };
    },
  };
}
export async function createServer() {
  const app = fastify();

  const schema = await buildSchema({
    resolvers: [UserResolver],
  });

  const server = new ApolloServer({
    schema,
    plugins: [
      fastifyAppClosePlugin(app),
      ApolloServerPluginDrainHttpServer({ httpServer: app.server }),
    ],
    context: buildContext,
  });

  return { app, server };
}

const subscriptionServer = (schema: GraphQLSchema, server: ApolloServer) => {
  return SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,

      async onConnect(connectionParams: Object) {
        return buildContext({
          connectionParams,
        });
      },
    },
    {
      server,
      path: "/graphql",
    }
  );
};
