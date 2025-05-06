export class CreateThreadPayload {
  name: string;
  server_id: string;

  constructor(partial: Partial<CreateThreadPayload>) {
    Object.assign(this, partial);
  }
}
