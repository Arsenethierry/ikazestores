import { useParams } from "next/navigation"

export const useCurrentStoreId = () => {
    const params = useParams();
    return params?.storeId as string;
}