import { UsersDataTable } from '@/features/users/components/users-data-table';
import { getAllUsersData } from '@/features/users/users-actions';
import React from 'react';

async function page() {
    const users = await getAllUsersData({});

    if ("error" in users) {
        return <div className="text-red-500">Error: {users.error}</div>;
    }

    return (
        <div>
            <UsersDataTable data={users.documents} />
        </div>
    );
}

export default page;