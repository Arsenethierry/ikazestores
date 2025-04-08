import { getAuthState } from '@/lib/user-label-permission';
import { Avatar, AvatarImage, Image } from '@radix-ui/react-avatar';
import React from 'react';

async function ProductDetails() {
    const ProductDetails = {
        id: 1,
        name: "Product Name",
        description: "Product Description",
        price: 100,
        images: [
            "https://rukminim2.flixcart.com/image/128/128/xif0q/projector/v/z/m/4k-2k-lcd-led-180-degree-rotation-android-11-wifi-6-bt-5-0-auto-original-imah9yzhfba8bzg2.jpeg",
            "https://rukminim2.flixcart.com/image/128/128/xif0q/projector/e/b/7/4k-2k-lcd-led-180-degree-rotation-android-11-wifi-6-bt-5-0-auto-original-imah9yzhaxyqf6dh.jpeg",
            "https://rukminim2.flixcart.com/image/128/128/xif0q/projector/2/y/o/4k-2k-lcd-led-180-degree-rotation-android-11-wifi-6-bt-5-0-auto-original-imah9yzhzeeyhbmf.jpeg",
            "https://rukminim2.flixcart.com/image/128/128/xif0q/projector/v/4/l/4k-2k-lcd-led-180-degree-rotation-android-11-wifi-6-bt-5-0-auto-original-imah9yzhbba8zfza.jpeg",
            "https://rukminim2.flixcart.com/image/128/128/xif0q/projector/2/0/o/4k-2k-lcd-led-180-degree-rotation-android-11-wifi-6-bt-5-0-auto-original-imah9yzhr7axnkea.jpeg"

        ]
    };
    const { user } = await getAuthState();

    return (
        <div className='main-container py-5 xl:py-10 flex gap-4'>            
            <div className="w-32 flex flex-col">
                {ProductDetails.images.map((image, index) => (
                <Avatar key={index} className="mb-2 hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer hover:p-2 hover:border-2 hover:border-violet-500">
                    <Image
                        src={image}
                        alt="Picture of the author"
                        />
                </Avatar>))}
            </div>
            <div className="w-1/2">
            <Avatar>
                <Image src="https://rukminim2.flixcart.com/image/832/832/xif0q/projector/v/4/l/4k-2k-lcd-led-180-degree-rotation-android-11-wifi-6-bt-5-0-auto-original-imah9yzhbba8zfza.jpeg" alt="Product Image" className="w-full h-full object-cover rounded-sm" />
            </Avatar>
            </div>
            <div className="bg-gray-400 border w-full py-2"></div>
        </div>
    );
}

export default ProductDetails;