/* eslint-disable @typescript-eslint/no-explicit-any */

import { DATABASE_ID, STORE_BUCKET_ID } from "../env-config";

export class AppwriteRollback {
    private storage: any;
    private databases: any;
    private createdFiles: string[];
    private createdDocuments: { collectionId: string, documentId: string }[] = [];

    constructor(storage?: any, databases?: any) {
        this.storage = storage;
        this.databases = databases;
        this.createdFiles = [];
        this.createdDocuments = [];
    }

    async trackFile(bucketId: string, fileId: string) {
        this.createdFiles.push(fileId);
    }

    async trackDocument(collectionId: string, documentId: string) {
        this.createdDocuments.push({ collectionId, documentId });
    }

    async rollback() {
        for (const fileId of this.createdFiles) {
            try {
                await this.storage.deleteFile(STORE_BUCKET_ID, fileId)
            } catch (error) {
                console.error("Error rolling back file:", fileId, error);
            }
        }

        for (const { collectionId, documentId } of this.createdDocuments) {
            try {
                await this.databases.deleteDocument(DATABASE_ID, collectionId, documentId);
            } catch (error) {
                console.error("Error rolling back document:", documentId, error);
            }
        }
    }
}