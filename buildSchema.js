import { buildSchema } from "graphql";
import fs from "fs";

const gqlSchema = fs.readFileSync("./schema.graphql", "utf8");

export const schema = buildSchema(gqlSchema);