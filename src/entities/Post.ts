import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Post {
  @PrimaryKey()
  _id!: number;

  @Property({type: "Date"})
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({type: 'string'})
  title!: string;
}
