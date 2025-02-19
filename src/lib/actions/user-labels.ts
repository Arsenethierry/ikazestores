import 'server-only'

import { createAdminClient } from '../appwrite'

export const updateUserLabels = async (userId: string, labels: string[]) => {
    try {
        const { users } = await createAdminClient();
        users.updateLabels(userId, labels)
    } catch (error) {
        throw error
    }
}