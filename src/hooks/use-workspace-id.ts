import { useParams } from "next/navigation"

export const useCurrrentStoreId = () => {
    const params = useParams();
    return params?.storeId as string;
}