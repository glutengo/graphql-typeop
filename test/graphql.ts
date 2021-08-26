import { ArgsType } from 'graphql-typeop/decorators';

@ArgsType()
class GetUserArgs {
  login: string;
}
