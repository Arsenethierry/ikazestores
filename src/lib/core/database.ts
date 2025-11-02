import { ID, Models, Query } from "node-appwrite";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";
import { DATABASE_ID } from "../env-config";
import { AppwriteErrorHandler } from "../errors/appwrite-errors";
import { VirtualStore } from "../types/appwrite/appwrite";

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: "asc" | "desc";
  filters?: QueryFilter[];
}

export interface QueryFilter {
  field: string;
  operator:
    | "equal"
    | "notEqual"
    | "lessThan"
    | "lessThanEqual"
    | "greaterThan"
    | "greaterThanEqual"
    | "contains"
    | "isNull"
    | "isNotNull"
    | "in";
  value?: any;
  values?: any[];
}
export interface PaginationResult<T> {
  documents: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export abstract class BaseModel<T extends Models.Document> {
  protected cache = new Map<string, { data: any; expiry: number }>();
  protected timestampFields = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  };

  constructor(protected collectionId: string) {}

  async findById(
    id: string,
    options: { cache?: CacheOptions }
  ): Promise<T | null> {
    try {
      if (options.cache) {
        const cached = this.getFromCache(`findById:${id}`);
        if (cached) return cached;
      }
      const { databases } = await createSessionClient();
      const document = await databases.getDocument<T>(
        DATABASE_ID,
        this.collectionId,
        id
      );

      if (options.cache) {
        this.setCache(`findById:${id}`, document, options.cache);
      }
      return document;
    } catch (error) {
      const appwriteError = AppwriteErrorHandler.handle(error);
      if (appwriteError.status === 404) return null;
      return null;
    }
  }

  async findMany(options: QueryOptions = {}): Promise<PaginationResult<T>> {
    try {
      const { databases } = await createSessionClient();
      const queries = this.buildQueries(options);
      const response = await databases.listDocuments<T>(
        DATABASE_ID,
        this.collectionId,
        queries
      );

      return {
        documents: response.documents,
        total: response.total,
        limit: options.limit || 25,
        offset: options.offset || 0,
        hasMore:
          (options.offset || 0) + response.documents.length < response.total,
      };
    } catch (error) {
      console.log("await databases.listDocuments error: ", error);
      return {
        documents: [],
        total: 0,
        limit: options.limit || 0,
        offset: options.offset || 0,
        hasMore: false,
      };
    }
  }

  async findOne(filters: QueryFilter[]): Promise<T | null> {
    const result = await this.findMany({
      filters,
      limit: 1,
    });
    return result.documents[0] || null;
  }

  async create(data: Omit<T, keyof VirtualStore>, userId: string): Promise<T> {
    try {
      const { databases } = await createAdminClient();
      const permissions = createDocumentPermissions({ userId });
      const documentId = ID.unique();

      const document = await databases.createDocument<T>(
        DATABASE_ID,
        this.collectionId,
        documentId,
        data,
        permissions
      );

      this.invalidateCache(["findMany"]);

      return document;
    } catch (error) {
      console.log("create error: ", error);
      throw AppwriteErrorHandler.handle(error);
    }
  }

  async update(
    id: string,
    updateData: Omit<T, keyof Models.Document>
  ): Promise<T> {
    try {
      const { databases } = await createSessionClient();
      const document = await databases.updateDocument<T>(
        DATABASE_ID,
        this.collectionId,
        id,
        updateData
      );

      this.invalidateCache([`findById:${id}`, "findMany"]);

      return document;
    } catch (error) {
      throw AppwriteErrorHandler.handle(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { databases } = await createSessionClient();
      await databases.deleteDocument(DATABASE_ID, this.collectionId, id);

      this.invalidateCache([`findById:${id}`, "findMany"]);
    } catch (error) {
      throw AppwriteErrorHandler.handle(error);
    }
  }

  async findByField(
    field: string,
    value: string | boolean | number,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const filters: QueryFilter[] = [
      { field, operator: "equal", value },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findOneByField(
    field: string,
    value: string | boolean | number
  ): Promise<T | null> {
    const filters: QueryFilter[] = [{ field, operator: "equal", value }];
    return this.findOne(filters);
  }

  async findByMultipleFields(
    conditions: Record<string, string | boolean | number>,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const filters: QueryFilter[] = Object.entries(conditions).map(
      ([field, value]) => ({
        field,
        operator: "equal" as const,
        value,
      })
    );

    return this.findMany({
      ...options,
      filters: [...filters, ...(options.filters || [])],
    });
  }

  async updatePartial(
    id: string,
    updates: Partial<Omit<T, keyof Models.Document>>
  ): Promise<T> {
    return this.update(id, updates as any);
  }

  async findWhereLessThan(
    field: string,
    value: string | number,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const filters: QueryFilter[] = [
      { field, operator: "lessThan", value },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async incrementField(
    id: string,
    field: keyof T,
    incrementBy: number = 1
  ): Promise<T> {
    const document = await this.findById(id, {});
    if (!document) {
      throw new Error("Document not found");
    }

    const currentValue = (document[field] as number) || 0;
    const updates = {
      [field]: currentValue + incrementBy,
    } as Partial<Omit<T, keyof Models.Document>>;

    return this.update(id, updates as any);
  }

  async batchUpdate(
    ids: string[],
    updates: Partial<Omit<T, keyof Models.Document>>
  ): Promise<T[]> {
    const { databases } = await createAdminClient();

    const updatePromises = ids.map((id) =>
      databases.updateDocument<T>(DATABASE_ID, this.collectionId, id, updates)
    );

    const results = await Promise.all(updatePromises);

    // Invalidate cache
    ids.forEach((id) => this.invalidateCache([`findById:${id}`]));
    this.invalidateCache(["findMany"]);

    return results;
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const filters: QueryFilter[] = [
      { field: "$createdAt", operator: "greaterThanEqual", value: startDate },
      { field: "$createdAt", operator: "lessThanEqual", value: endDate },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async count(filters: QueryFilter[] = []): Promise<number> {
    try {
      const queries = this.buildFilterQueries(filters);
      queries.push(Query.limit(1));

      const { databases } = await createSessionClient();
      const result = await databases.listDocuments<T>(
        DATABASE_ID,
        this.collectionId,
        queries
      );
      return result.total;
    } catch (error) {
      console.log("databases.listDocuments error: ", error);
      throw AppwriteErrorHandler.handle(error);
    }
  }

  async exists(filters: QueryFilter[]): Promise<boolean> {
    const result = await this.findOne(filters);
    return result !== null;
  }

  async paginate(
    page: number,
    perPage: number = 25,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const offset = (page - 1) * perPage;
    return this.findMany({
      ...options,
      offset,
      limit: perPage,
    });
  }

  protected buildFilterQueries(filters: QueryFilter[]): string[] {
    const queries: string[] = [];

    for (const filter of filters) {
      switch (filter.operator) {
        case "equal":
          queries.push(Query.equal(filter.field, filter.value));
          break;
        case "notEqual":
          queries.push(Query.notEqual(filter.field, filter.value));
          break;
        case "lessThan":
          queries.push(Query.lessThan(filter.field, filter.value));
          break;
        case "lessThanEqual":
          queries.push(Query.lessThanEqual(filter.field, filter.value));
          break;
        case "greaterThan":
          queries.push(Query.greaterThan(filter.field, filter.value));
          break;
        case "greaterThanEqual":
          queries.push(Query.greaterThanEqual(filter.field, filter.value));
          break;
        case "contains":
          queries.push(Query.search(filter.field, filter.value));
          break;
        case "isNull":
          queries.push(Query.isNull(filter.field));
          break;
        case "isNotNull":
          queries.push(Query.isNotNull(filter.field));
          break;
        case "in":
          if (filter.values) {
            queries.push(Query.contains(filter.field, filter.values));
          }
          break;
      }
    }

    return queries;
  }

  protected buildQueries(options: QueryOptions): string[] {
    const queries: string[] = [];

    if (options.filters) {
      queries.push(...this.buildFilterQueries(options.filters));
    }

    if (options.limit) queries.push(Query.limit(options.limit));
    if (options.offset) queries.push(Query.offset(options.offset));

    if (options.orderBy) {
      const orderType =
        options.orderType === "desc" ? Query.orderDesc : Query.orderAsc;
      queries.push(orderType(options.orderBy));
    }

    return queries;
  }

  // ===== CACHE MANAGEMENT =====
  protected getFromCache(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  protected setCache(key: string, data: T, options: CacheOptions): void {
    const expiry = Date.now() + (options.ttl || 300) * 1000;
    this.cache.set(options.key || key, { data, expiry });
  }

  protected invalidateCache(patterns: string[]): void {
    for (const pattern of patterns) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }

  protected clearCache(): void {
    this.cache.clear();
  }
}
