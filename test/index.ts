import { Field, ObjectType, getFieldsDocument } from '../dist/decorators';
import { print } from 'graphql/language/printer'

@ObjectType()
class MyObjectType {
  @Field()
  f: string;
}

@ObjectType()
class MyArgsType {
  a?: string;
}

const doc = getFieldsDocument('getMyObjectType', MyObjectType, MyArgsType);
console.log(print(doc));
