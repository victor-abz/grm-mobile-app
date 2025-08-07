export abstract class BaseRemoteRepository<T> {
    abstract create(item: T): Promise<T>;
    abstract delete(id: string): Promise<void>;
    abstract fetchAll(): Promise<T[]>;
    abstract fetchById(id: string): Promise<T>;
    abstract update(id: string, item: T): Promise<T>;
}
  