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
import { createQueryBuilder, getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
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
    console.log(updoot);

    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });

    // The user has voted on the post before and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
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
      });
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

    const _post = await Post.findOne({ where: { _id: postId } });
    console.log(_post);

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
    @Arg("cursor", () => String, { nullable: true }) cursor: string,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const actualLimit = Math.min(30, limit);
    const actualLimitPlusOne = actualLimit + 1;

    const replacements: any[] = [actualLimitPlusOne];

    if (req.session.userId) replacements.push(req.session.userId);

    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseFloat(cursor)));
      cursorIdx = replacements.length;
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
    ) creator,
    ${
      req.session.userId
        ? `(select value from updoot where "userId" = $2 and "postId" = p._id) "voteStatus"`
        : 'null as "voteStatus"'
    }
    from post p
    inner join public.user u on u._id = p."creatorId"
    ${cursor ? `where p."createdAt" < $${cursorIdx}` : ""}
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

    return {
      posts: posts.slice(0, actualLimit),
      hasMore: posts.length === actualLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) _id: number): Promise<Post | null> {
    return Post.findOne({ where: { _id }, relations: ["creator"] });
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
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text", () => String, { nullable: true }) text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    // const post = await Post.findOneBy({ _id });
    // if (!post) {
    //   return null;
    // }
    // if (typeof title !== "undefined") {
    //   post.title = title;
    //   post.text = text;
    //   Post.update({ _id }, { title, text });
    // }
    // return post;

    // OR

    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('_id = :_id and "creatorId" = :creatorId', {
        _id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) _id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // not cascade way
    // const post = await Post.findOne({where: { _id }});
    // if (!post) return false;

    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorized")
    // }

    // try {
    //   await Updoot.delete({ postId: _id });
    //   await Post.delete({ _id });
    // } catch (error) {
    //   return false;
    // }

    // cascade way which requires adding the onDelete property in the Updoot entity
    await Post.delete({ _id, creatorId: req.session.userId });

    return true;
  }
}
