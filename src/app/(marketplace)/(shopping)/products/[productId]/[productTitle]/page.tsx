import React from 'react';

function page() {
    return (
        <div className='flex gap-4'>
            <aside className='w-64 shrink-0'>
                Products fielters
            </aside>
            <div className='flex-1'>
                Products display
            </div>
        </div>
    );
}

export default page;