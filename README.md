# graphql-typeop
[![npm version](https://badge.fury.io/js/graphql-typeop.svg)](https://www.npmjs.com/package/graphql-typeop) 
[![pipeline status](https://github.com/glutengo/graphql-typeop/actions/workflows/npm-test.yml/badge.svg)](https://github.com/glutengo/graphql-typeop/actions)
# Introduction
This library introduces a new way of controlling and defining GraphQL return types: via TypeScript classes.
The approach is strongly inspired by the code-first approach for using GraphQL in Nest.js server applications used in [@nestjs/graphql](https://github.com/nestjs/graphql) by [Kamil Mysliwiec](https://twitter.com/kammysliwiec).

# Installation
```npm install graphql-typeop```

# Usage
## Decorators
The following decorators are provided by this package: `@ObjectType()`, `@Field()`, `@ArgsType` and `@Arg`.

<table>
<tr>
<th>TypeScript</th>
<th>GraphQL</th>
</tr>
<tr>
<td>

```TypeScript
@ObjectType()
class DetailPost {
    id!: number;
    content!: string;
}

@ArgsType()
class GetPostsArgs {
    page?: number;
    size?: number;
}
```

</td>
<td>

```GraphQL
query getPosts($page: Int, $size: Int) {
    posts(page: $page, size: $size) {
        id
        content
    }
}
```

</td>
</tr>
</table>

### `@ObjectType()`
This class decorator can be used to mark a class as describing the selection set of a GraphQL operation.
This decorator is only informal and provides no standalone functionality.
However, it is read by the TypeScript transformer (see below) and can be used to achieve a more concise syntax.

### `@Field()`
Every property which belongs to an `@ObjectType` class and represents a GraphQL argument needs to be annotated with `@Field` to ensure that it is included the created GraphQL `DocumentNode`s.

The decorator accepts two optional parameters:

#### Type
The Type of the field. Can be passed as a TypeScript Class.
If no type is passed, it is derived from the TypeScript metadata.
Note: this is not possible for array types as TypeScript handles these as Objects.

#### Options
The options for the field. See [reflection.util.ts](src/util/reflection.util.ts).

### `@ArgsType()`
This class decorator can be used to mark a class as describing the selection set of a GraphQL operation.
This decorator is only informal and provides no standalone functionality.
However, it is read by the TypeScript transformer (see below) and can be used to achieve a more concise syntax.

### `@Arg()`
Every property which belongs to an `@ArgsType` class and represents a GraphQL argument needs to be annotated with `@Arg` to ensure that it is included the created GraphQL `DocumentNode`s.
The decorator accepts two optional parameters:

#### Type
The Type of the argument. Can be passed as a TypeScript Class.
If no type is passed, it is derived from the TypeScript metadata.
Note: this is not possible for array types as TypeScript handles these as Objects.

#### Options
The options for the argument. See [reflection.util.ts](src/util/reflection.util.ts).

## DocumentBuilder
This package provides builders for all types of GraphQL operations.
They all return a GraphQL [DocumentNode](https://github.com/graphql/graphql-js/blob/main/src/utilities/typedQueryDocumentNode.ts) which can be passed to many GraphQL client implementations such as `@apollo/client`.

### `buildQuery()`

### `buildMutation()`

### `buildSubscription()`

## TypeScript Transformer
The TypeScript transformer can be used to simplify the syntax required for `ObjectType` and `ArgsType` definitions.
If it is active, it is not required to mark each property of classes annotated with `@ObjectType` and `@ArgsType` with the respective property decorator.
The transformer takes over this task.

Read more on TypeScript transformers [here](https://43081j.com/2018/08/creating-a-typescript-transform).

## [GraphQL Code Generator](https://github.com/dotansimha/graphql-code-generator) Plugin



