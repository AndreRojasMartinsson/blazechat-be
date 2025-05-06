<br/>
<br/>
<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

# ChatBlaze - Backend
<br/>
  <p>The ChatBlaze application backend using <a href="https://nestjs.com">a progressive framework</a> for building efficient and scalable server-side applications.</p>

<br/>

## Project setup

### Database SSL Certificate

Download Supabase SSL certificate from remote at:
<a href="https://supabase.com/dashboard/project/hmujnhvjickpckkrruec/settings/database" target="blank">Database Settings</a>
and place in the root directory. Then make sure path at `src/database/database.provider.ts`
is correct for the certificate path.

### Environment Files

Check `.env.example` for an example environment file; but to actually pull in env file, use `dotenv vault`.

Pull environment file from remote:
```bash
$ bunx dotenv-vault@latest pull
```

**Do not commit `.env.me` or any `*.env*`, only commit `.env.vault`**

To push env file to remote:
```bash
$ bunx dotenv-vault@latest push
```

### Install Dependencies:

```bash
$ bun install
```

## Compile and run the project

```bash
# development
$ bun dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ bun run test

# e2e tests
$ bun run test:e2e

# test coverage
$ bun run test:cov
```

## Deployment

When you're ready to deploy the application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ bun add -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).


## Stay in touch

- Author - [Andr‚ Rojas Martinsson](https://github.com/AndreRojasMartinsson)
- Website - [https://chat.activework.se](https://chat.activework.se)

## License

ChatBlaze Backend is [MIT licensed](https://github.com/AndreRojasMartinsson/chatblaze-be/blob/master/LICENSE).

