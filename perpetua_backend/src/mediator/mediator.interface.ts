export interface ICommand<TResponse = any> {
  readonly kind: string;
}

export interface IQuery<TResponse = any> {
  readonly kind: string;
}

export interface IHandler<TRequest extends ICommand | IQuery, TResponse = any> {
  handle(request: TRequest): Promise<TResponse>;
}

export interface IMediator {
  register<TRequest extends ICommand | IQuery, TResponse>(
    kind: string,
    handler: IHandler<TRequest, TResponse>
  ): void;

  send<TResponse>(request: ICommand<TResponse> | IQuery<TResponse>): Promise<TResponse>;
}
