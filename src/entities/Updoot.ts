import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// Upvote Schema
@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @Field()
  @PrimaryGeneratedColumn()
  _id: number;

  @Field()
  @Column({ type: "int" })
  userId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @Field()
  @Column({ type: "int" })
  postId: number;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.updoots)
  post: Post;
}
