import { Arg, ArgsType, Field, ObjectType } from '../dist/decorators';
import { buildQuery } from '../dist/builders';
import { print } from 'graphql/language/printer'
import { normalizeDoc } from './util';

@ObjectType()
class Composite {
  @Field()
  id: number;
  @Field()
  value: string
}

@ObjectType()
class Nested {
  @Field()
  id: number;
  @Field(Composite)
  composites: Composite[];
}

@ObjectType()
class OmittedField {
  @Field()
  id: number;
  value: string;
}

interface AliasBase {
  id: number;
  value: string;
}

@ObjectType()
class Alias implements Partial<AliasBase> {
  @Field()
  id: number;
  @Field<AliasBase>({ aliasFor: 'value' })
  alias: string;
}

@ObjectType()
class Skipped {
  @Field()
  id: number;
  @Field({ skip: true })
  skipped: string;
}

@ObjectType()
class Included {
  @Field()
  id: number;
  @Field({ include: true })
  included: string;
}

@ArgsType()
class Args {
  @Arg()
  id: number;
}

@ObjectType()
class NestedWithArgs {
  @Field()
  id: number;
  @Field<NestedWithArgs, Args>(Composite, { args: { id: '$id' }})
  composites: Composite[]
}

describe('documentBuilder', () => {

    it ('should build a query with all fields', () => {
      const doc = print(buildQuery(Composite));
      const expectedQuery = '{ id value }';
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should build not include properties without the field decorator in the query', () => {
      const doc = print(buildQuery(OmittedField));
      const expectedQuery = '{ id }';
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should build a query with nested fields', () => {
      const doc = print(buildQuery(Nested));
      const expectedQuery = '{ id composites { id value } }';
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should build a query with the alias mapping', () => {
      const doc = print(buildQuery(Alias));
      const expectedQuery = '{ id alias: value }';
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should use the skip decorator', () => {
      const doc = print(buildQuery(Skipped));
      const expectedQuery = '{ id skipped @skip(if: true) }';
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should use the include decorator', () => {
      const doc = print(buildQuery(Included));
      const expectedQuery = '{ id included @include(if: true) }';
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should map top level arguments', () => {
      const doc = print(buildQuery(Composite, Args));
      const expectedQuery = 'query ($id: Int!) { id value }'
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });

    it ('should map field level arguments', () => {
      const doc = print(buildQuery(NestedWithArgs, Args));
      const expectedQuery = 'query ($id: Int!) { id composites(id: $id) { id value } }'
      expect(normalizeDoc(doc)).toEqual(normalizeDoc(expectedQuery));
    });
});





