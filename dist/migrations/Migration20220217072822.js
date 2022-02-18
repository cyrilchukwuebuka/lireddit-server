"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20220217072822 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20220217072822 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "post" ("_id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" varchar(255) not null);');
    }
}
exports.Migration20220217072822 = Migration20220217072822;
//# sourceMappingURL=Migration20220217072822.js.map