import { Query, Resolver } from "type-graphql";
import { User } from "./user.dto";

@Resolver(() => User)
class UserResolver {
  @Query(() => User)
  user() {
    return {
      id: "912389",
      email: "sdasdsad",
      username: "sddasda29249924asdsad",
    };
  }
}

export default UserResolver;
