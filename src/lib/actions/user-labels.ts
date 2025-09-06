import 'server-only'

import { createAdminClient } from '../appwrite'
import { Query } from 'node-appwrite';

export const updateUserLabels = async (userId: string, labels: string[]) => {
    try {
        const { users } = await createAdminClient();
        users.updateLabels(userId, labels)
    } catch (error) {
        throw error
    }
}

export async function getUsersRolesByLabels(labels: string[]) {
    try {
        const { users } = await createAdminClient();
        
        const result = await users.list([
            Query.contains('labels', labels)
        ]);
        
        return result.users;
    } catch (error) {
        console.error("Error fetching users with multiple labels:", error);
        return [];
    }
}