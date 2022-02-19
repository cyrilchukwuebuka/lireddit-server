import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Post {
  @Field()
  @PrimaryKey()
  _id!: number;

  @Field(() => String)
  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Field(() => String)
  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field()
  @Property({ type: "string" })
  title!: string;
}