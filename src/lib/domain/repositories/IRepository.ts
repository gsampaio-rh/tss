/**
 * Base Repository Interface
 * Defines common data access operations following Repository Pattern
 */

/**
 * Base repository interface with common CRUD operations
 */
export interface IRepository<T, TId = string> {
	/**
	 * Find an entity by its ID
	 */
	findById(id: TId): Promise<T | null>;

	/**
	 * Find all entities
	 */
	findAll(): Promise<T[]>;

	/**
	 * Save an entity (create or update)
	 */
	save(entity: T): Promise<T>;

	/**
	 * Delete an entity by ID
	 */
	delete(id: TId): Promise<void>;

	/**
	 * Check if an entity exists by ID
	 */
	exists(id: TId): Promise<boolean>;

	/**
	 * Count total entities
	 */
	count(): Promise<number>;
}

/**
 * Read-only repository interface for immutable data
 */
export interface IReadOnlyRepository<T, TId = string> {
	/**
	 * Find an entity by its ID
	 */
	findById(id: TId): Promise<T | null>;

	/**
	 * Find all entities
	 */
	findAll(): Promise<T[]>;

	/**
	 * Check if an entity exists by ID
	 */
	exists(id: TId): Promise<boolean>;

	/**
	 * Count total entities
	 */
	count(): Promise<number>;
}

