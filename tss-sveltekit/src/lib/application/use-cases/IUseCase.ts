/**
 * Base Use Case Interface
 * Represents an application-specific business operation
 * 
 * Use cases encapsulate application logic and orchestrate domain services
 */

/**
 * Base use case interface
 * @template TRequest - Request/Input type
 * @template TResponse - Response/Output type
 */
export interface IUseCase<TRequest, TResponse> {
	/**
	 * Execute the use case
	 */
	execute(request: TRequest): Promise<TResponse>;
}

/**
 * Use case with no request (void input)
 */
export interface IUseCaseNoRequest<TResponse> {
	execute(): Promise<TResponse>;
}

/**
 * Use case with no response (void output)
 */
export interface IUseCaseNoResponse<TRequest> {
	execute(request: TRequest): Promise<void>;
}

/**
 * Use case with no request or response
 */
export interface IUseCaseVoid {
	execute(): Promise<void>;
}

