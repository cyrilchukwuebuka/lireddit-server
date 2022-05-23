import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
// import { EntityManager } from "@mikro-orm/postgresql";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister, validatePassword } from "../utils/validateInputs";
import { EntityManager } from "@mikro-orm/postgresql";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from 'uuid';
import { errorMessage } from "../utils/errorMessage";

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    // if user is not logged in
    if (!req.session.userId) {
      return null;
    }

    console.log(req.session.userId);
    const user = await em.findOne(User, { _id: req.session.userId });

    return user;
  }

  @Mutation(() => UserResponse)
  async changePassword (
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validatePassword(newPassword);
    if (errors) {
      return { errors };
    }

    const key = FORGET_PASSWORD_PREFIX + token;

    const userId = await redis.get(key);
    if (!userId) {
        return errorMessage("token", "token expired or invalid");
    }

    const user = await em.findOne(User, { _id: parseInt(userId) });

    if (!user) {
        return errorMessage("token", "user no longer exists");
    }

    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    await redis.del(key);

    // log in user after change password
    req.session.userId = user._id;

    return {
      user
    }
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { em, redis }: MyContext) {
    const user = await em.findOne(User, { email });
    
    if(!user) {
      // email does not exist
      // and wouldn't want the user to keep on trying several emails
      return true;
    }

    const token = v4();
    await redis.set(FORGET_PASSWORD_PREFIX + token, user._id, 'EX', 1000 * 60 * 60 * 12)

    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    
    return true;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    
    const hashedPassword = await argon2.hash(options.password);
    // const user = em.create(User, {
    //   username: options.username,
    //   password: hashedPassword,
    // });

    // try {
    //   await em.persistAndFlush(user);
    // } 

    // alternative
    let user;
    try {
      const result = await(em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning("*");
      user = result[0];
    }
    catch (err) {
      console.log(err.message);
      if (err.code === "23505") {
        return errorMessage("username", "username already taken");
      }
    }

    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    // "options" can either be explicitly type inferred or declared
    // just like in the register
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, usernameOrEmail.includes("@") ? 
      { email: usernameOrEmail } :
      { username: usernameOrEmail }
    );

    if (!user) {
      return errorMessage("usernameOrEmail", "username doesn't exist");
    }

    if (!password) {
      return errorMessage("password", "empty field");
    }

    const validPassword = await argon2.verify(user.password, password);

    if (!validPassword) {
      return errorMessage("password", "incorrect password");
    }

    // store user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session.userId = user._id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        // req.session.destroy() clears session in redis
        // clearCookie clears cookie in browser
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
        }

        resolve(true);
      })
    );
  }
}
