import { Post } from "../entities/Post";
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
@InputType()
class PostInput {
  @Field()
  title: string
  
  @Field()
  text: string
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string,
  ): Promise<Post[]> {
    const actualLimit = Math.min(30, limit);
    const queryBuilder = getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      .orderBy('"createdAt"', "DESC")
      .take(actualLimit)
    
    if (cursor) {
      queryBuilder.where( '"createdAt" < :cursor', {
        cursor: new Date(parseFloat(cursor))
      })
    }

    return queryBuilder.getMany()
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) _id: number): Promise<Post | null> {
    return Post.findOneBy({ _id });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() {req}: MyContext
  ): Promise<Post> {
    return Post.create({ 
      ...input,
      creatorId: req.session.userId
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) _id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
  ): Promise<Post | null> {
    const post = await Post.findOneBy({ _id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      Post.update({_id}, {title})
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) _id: number,
  ): Promise<boolean> {
    try {
      Post.delete({_id})
    } catch (error) {
      return false;
    }
    return true;
  }
}
