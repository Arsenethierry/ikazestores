import { DATABASE_ID } from "../env-config";

type CreatedFileRef = { bucketId: string; fileId: string };
type CreatedDocRef = { collectionId: string; documentId: string };

export class AppwriteRollback {
  private storage: any;
  private databases: any;
  private teams: any;

  private createdFiles: CreatedFileRef[] = [];
  private createdDocuments: CreatedDocRef[] = [];
  private createdTeams: string[] = [];

  constructor(storage?: any, databases?: any, teams?: any) {
    this.storage = storage;
    this.databases = databases;
    this.teams = teams;
  }

  /**
   * Track a file by its bucket + file ID.
   * Works with multiple buckets (e.g., STORE_BUCKET_ID, PRODUCTS_BUCKET_ID).
   */
  async trackFile(bucketId: string, fileId: string) {
    this.createdFiles.push({ bucketId, fileId });
  }

  async trackDocument(collectionId: string, documentId: string) {
    this.createdDocuments.push({ collectionId, documentId });
  }

  async trackTeam(teamId: string) {
    this.createdTeams.push(teamId);
  }

  /**
   * Roll back everything we tracked, newest-first to handle dependencies gracefully.
   */
  async rollback() {
    // Files (delete with the bucket they were created in)
    for (const { bucketId, fileId } of [...this.createdFiles].reverse()) {
      try {
        await this.storage.deleteFile(bucketId, fileId);
      } catch (error) {
        console.error(
          `Error rolling back file ${fileId} in bucket ${bucketId}:`,
          error
        );
      }
    }

    // Documents
    for (const { collectionId, documentId } of [
      ...this.createdDocuments,
    ].reverse()) {
      try {
        await this.databases.deleteDocument(
          DATABASE_ID,
          collectionId,
          documentId
        );
      } catch (error) {
        console.error(
          `Error rolling back document ${documentId} in collection ${collectionId}:`,
          error
        );
      }
    }

    // Teams
    for (const teamId of [...this.createdTeams].reverse()) {
      try {
        await this.teams.delete(teamId);
      } catch (error) {
        console.error(`Failed to rollback team ${teamId}:`, error);
      }
    }
  }

  /**
   * (Optional) Clear tracked state if you reuse the instance.
   */
  reset() {
    this.createdFiles = [];
    this.createdDocuments = [];
    this.createdTeams = [];
  }
}
