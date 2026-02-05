export type Id<TableName extends string = string> = string & {
  __tableName?: TableName;
};
