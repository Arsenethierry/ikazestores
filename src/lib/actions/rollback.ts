/* eslint-disable @typescript-eslint/no-explicit-any */

import { DATABASE_ID, STORE_BUCKET_ID } from "../env-config";

export class AppwriteRollback {
    private storage: any;
    private databases: any;
    private teams: any;
    private createdFiles: string[];
    private createdDocuments: { collectionId: string, documentId: string }[] = [];
    private createdTeams: string[] = [];

    constructor(storage?: any, databases?: any, teams?: any) {
        this.storage = storage;
        this.databases = databases;
        this.teams = teams;
        this.createdFiles = [];
        this.createdDocuments = [];
        this.createdTeams = [];
    }

    async trackFile(bucketId: string, fileId: string) {
        this.createdFiles.push(fileId);
    }

    async trackDocument(collectionId: string, documentId: string) {
        this.createdDocuments.push({ collectionId, documentId });
    }

    async trackTeam(teamId: string) {
        this.createdTeams.push(teamId);
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

        for (const teamId of this.createdTeams) {
            try {
                await this.teams.delete(teamId);
            } catch (error) {
                console.error(`Failed to rollback team ${teamId}:`, error);
            }
        }
    }
}