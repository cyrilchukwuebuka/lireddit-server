"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20220219193904 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20220219193904 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "user" ("_id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null);');
        this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
    }
}
exports.Migration20220219193904 = Migration20220219193904;
//# sourceMappingURL=Migration20220219193904.js.map