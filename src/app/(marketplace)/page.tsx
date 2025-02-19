import { getAllVirtualStores } from "@/lib/actions/vitual-store.action";

export default async function Home() {
  const virtualStores = await getAllVirtualStores();
  return (
    <div className="p-2">
      virtualStores: {JSON.stringify(virtualStores, undefined, 2)}
    </div>
  );
}
