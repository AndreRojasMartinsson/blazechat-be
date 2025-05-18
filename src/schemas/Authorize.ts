export interface AuthorizeQuery {
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  state: string;
}
