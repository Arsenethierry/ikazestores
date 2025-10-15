import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AcceptInvitationContent } from "@/features/staff/accept-invitation-content";

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Loading invitation...</p>
          </div>
        }
      >
        <AcceptInvitationContent />
      </Suspense>
    </div>
  );
}