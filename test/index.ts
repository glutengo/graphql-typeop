import { Field, ObjectType, ArgsType } from '../dist/decorators';
import { buildMutation } from '../dist/builders';
import { print } from 'graphql/language/printer'

interface BaseObjectType {
  f?: string;
}

@ObjectType()
class ArrayType {
  id: number;
  value: string;
}

@ObjectType()
class MyObjectType implements Partial<BaseObjectType> {
  f: string;
  @Field<BaseObjectType, any, MyArgsType>({ aliasFor: 'f', skip: '$skipA' })
  a: string;
  g: ArrayType[];
}

type Query = {
  getMyObjectType: BaseObjectType
}

@ObjectType()
class MyQuery {
  @Field<Query, MyObjectArgs, MyArgsType>()
  result: MyObjectType;
}

class CompositeUser {
  login: string;
}

@ArgsType()
class MyArgsType {
  a?: string;
  skipA?: boolean;
  user: CompositeUser;
}

@ArgsType()
class MyObjectArgs {
  a?: string;
}



const doc = buildMutation(MyQuery, MyArgsType);
console.log(print(doc));
