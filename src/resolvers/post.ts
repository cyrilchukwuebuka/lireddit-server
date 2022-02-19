// import { Post } from "/../src/entities/Post";
import { Post } from "../entities/Post";
import { Ctx, Query, Resolver } from "type-graphql";
import { MyContext } from "src/types";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(
    @Ctx() ctx: MyContext
    // or in a destructured form as  @Ctx() {em}: MyContext
  ): Promise<Post[]> {
    return ctx.em.find(Post, {});
  }
}
