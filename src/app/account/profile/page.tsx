import Link from "next/link";
import { requireAuth, loadUserRow } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/profile-form";
import { Icon } from "@/components/icons";

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await loadUserRow(session.sub);

  if (!user) {
    return (
      <Card>
        <CardContent>
          <p className="py-6 text-center text-sm text-slate-500">User not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <Icon name="arrowLeft" size={16} />
          Back to My Account
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          <Icon name="user" size={32} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edit Profile</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone ?? "",
              bio: user.bio ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
