import { ICommand, IHandler, IMediator, IQuery } from './mediator.interface';

export class Mediator implements IMediator {
  private handlers = new Map<string, IHandler<any, any>>();

  register<TRequest extends ICommand | IQuery, TResponse>(
    kind: string,
    handler: IHandler<TRequest, TResponse>
  ): void {
    if (this.handlers.has(kind)) {
      throw new Error(`Handler for '${kind}' is already registered in Mediator.`);
    }
    this.handlers.set(kind, handler);
  }

  async send<TResponse>(request: ICommand<TResponse> | IQuery<TResponse>): Promise<TResponse> {
    const handler = this.handlers.get(request.kind);
    if (!handler) {
      throw new Error(`No handler registered for Mediator request kind: '${request.kind}'`);
    }
    return handler.handle(request);
  }
}

export const mediator = new Mediator();
