import { getLoggedInUser } from "@/lib/actions/auth.action";

export default async function Home() {
  const user = await getLoggedInUser();

  console.log("user: ",user);
  return (
    <div className="p-2">
      user: {JSON.stringify(user)}
    </div>
  );
}
