import { Post } from "../entities/Post";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}
@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });

    // The user has voted on the post before and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async tm => {
        await tm.query(
          `
        update updoot
        set value = $1
        where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
        update post
        set points = points + $1
        where _id = $2;
        `,
          [2 * realValue, postId]
        );
      })
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        insert into updoot ("userId", "postId", value)
        values ($1,$2,$3);
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
        update post
        set points = points + $1
        where _id = $2;
        `,
          [realValue, postId]
        );
      });
    }

    // await getConnection().query(
    //   `

    // START TRANSACTION;

    // insert into updoot ("userId", "postId", value)
    // values (${userId},${postId},${realValue});

    // update post
    // set points = points + ${realValue}
    // where _id = ${postId};

    // COMMIT;

    // `
    // );

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ): Promise<PaginatedPosts> {
    const actualLimit = Math.min(30, limit);
    const actualLimitPlusOne = actualLimit + 1;

    const replacements: any[] = [actualLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseFloat(cursor)));
    }

    const posts = await getConnection().query(
      `
    select p.*, 
    json_build_object(
      '_id', u._id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
    ) creator
    from post p
    inner join public.user u on u._id = p."creatorId"
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1

    `,
      replacements
    );

    // const queryBuilder = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("post")
    //   .innerJoinAndSelect(
    //     "post.creator",
    //     "creator",
    //     'creator.id = post."creatorId"',
    //   )
    //   .orderBy('post."createdAt"', "DESC")
    //   .take(actualLimitPlusOne);

    // if (cursor) {
    //   queryBuilder.where('post."createdAt" < :cursor', {
    //     cursor: new Date(parseFloat(cursor)),
    //   });
    // }

    // const posts = await queryBuilder.getMany();

    return {
      posts: posts.slice(0, actualLimit),
      hasMore: posts.length === actualLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) _id: number): Promise<Post | null> {
    return Post.findOneBy({ _id });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) _id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOneBy({ _id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      Post.update({ _id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) _id: number): Promise<boolean> {
    try {
      Post.delete({ _id });
    } catch (error) {
      return false;
    }
    return true;
  }
}
