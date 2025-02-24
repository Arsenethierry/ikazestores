import { useParams } from "next/navigation"

export const useStoreId = () => {
    const params = useParams();
    return params.storeId as string;
}