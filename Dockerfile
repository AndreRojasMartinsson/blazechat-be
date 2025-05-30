FROM oven/bun:latest

WORKDIR /app

COPY ./package.json ./bun.lockb ./
RUN bun install

COPY . .

CMD ["bun", "run", "build"]
CMD ["bun", "run", "start"]
