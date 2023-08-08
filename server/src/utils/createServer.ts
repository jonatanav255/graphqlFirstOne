import { buildSchema } from "type-graphql";
import UserResolver from "../modules/message/user/user.resolver";
import { ApolloServer } from "apollo-server-fastify";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import fastify from "fastify";

function BuildContext() {}
export async function createServer() {
  const app = fastify();

  const schema = await buildSchema({
    resolvers: [UserResolver],
  });

  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer: app.server })],
    context: BuildContext,
  });

  return { app, server };
}
// createServer()
