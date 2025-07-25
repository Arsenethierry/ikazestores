import { ID, ImageFormat, ImageGravity, Models } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { AppwriteErrorHandler } from "../errors/appwrite-errors";
import { CacheOptions } from "./database";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "../env-config";

export abstract class BaseStorageService {
    protected cache = new Map<string, { data: any; expiry: number }>();

    constructor(protected bucketId: string) { }

    async uploadFile(
        file: File,
    ) {
        try {
            const { storage } = await createSessionClient();
            const fileId = ID.unique();

            if (file instanceof File) {
                const uploadedFile = await storage.createFile(
                    this.bucketId,
                    fileId,
                    file
                );

                this.invalidateCache(['listFiles']);

                return uploadedFile
            } else {
                throw AppwriteErrorHandler.handle("invalid file type");
            }
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }

    async getFile(fileId: string, options: { cache?: CacheOptions } = {}): Promise<Models.File | null> {
        try {
            if (options.cache) {
                const cached = this.getFromCache(`getFile:${fileId}`);
                if (cached) return cached;
            }

            const { storage } = await createSessionClient();
            const file = await storage.getFile(this.bucketId, fileId);

            if (options.cache) {
                this.setCache(`getFile:${fileId}`, file, options.cache);
            }

            return file;
        } catch (error) {
            const appwriteError = AppwriteErrorHandler.handle(error);
            if (appwriteError.status === 404) return null;
            throw appwriteError;
        }
    }

    async getFilePreview(
        fileId: string,
        options: {
            width?: number;
            height?: number;
            gravity?: ImageGravity;
            quality?: number;
            borderWidth?: number;
            borderColor?: string;
            borderRadius?: number;
            opacity?: number;
            rotation?: number;
            background?: string;
            output?: ImageFormat
        } = {}
    ) {
        try {
            const { storage } = await createSessionClient();
            return await storage.getFilePreview(
                this.bucketId,
                fileId,
                options.width,
                options.height,
                options.gravity,
                options.quality,
                options.borderWidth,
                options.borderColor,
                options.borderRadius,
                options.opacity,
                options.rotation,
                options.background,
                options.output
            )
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }

    async getFileDownload(fileId: string) {
        try {
            const { storage } = await createSessionClient();
            return await storage.getFileDownload(this.bucketId, fileId);
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }

    async deleteFile(fileId: string): Promise<void> {
        try {
            const { storage } = await createSessionClient();
            await storage.deleteFile(this.bucketId, fileId);

            this.invalidateCache([`getFile:${fileId}`, 'listFiles']);
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
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

    async getFileUrl(fileId: string, type: 'view' | 'download' | 'preview' = 'view'): Promise<string> {
        switch (type) {
            case 'view':
                return `${APPWRITE_ENDPOINT}/storage/buckets/${this.bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
            case 'download':
                return `${APPWRITE_ENDPOINT}/storage/buckets/${this.bucketId}/files/${fileId}/download`;
            case 'preview':
                return `${APPWRITE_ENDPOINT}/storage/buckets/${this.bucketId}/files/${fileId}/preview`;
            default:
                return `${APPWRITE_ENDPOINT}/storage/buckets/${this.bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
        }
    }

    async uploadMultipleFiles(
        files: File[],
    ) {
        const uploadPromises = files.map((file) => {
            this.uploadFile(file)
        });

        try {
            return await Promise.all(uploadPromises);
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }

    async deleteMultipleFiles(fileIds: string[]): Promise<void> {
        const deletePromises = fileIds.map(fileId => this.deleteFile(fileId));

        try {
            await Promise.all(deletePromises);
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }

    protected getFromCache(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    protected setCache(key: string, data: any, options: CacheOptions): void {
        const expiry = Date.now() + (options.ttl || 300) * 1000;
        this.cache.set(options.key || key, { data, expiry });
    }
}