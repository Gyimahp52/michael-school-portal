import { CanteenFeeManagement } from "@/components/dashboard/CanteenFeeManagement";
import { useAuth } from "@/contexts/CustomAuthContext";

export default function CanteenPage() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || "";
  const currentUserName = currentUser?.displayName || currentUser?.username || "User";

  return (
    <div className="p-4 md:p-6">
      <CanteenFeeManagement currentUserId={currentUserId} currentUserName={currentUserName} />
    </div>
  );
}


