"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

type Member = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [ssoProvider, setSsoProvider] = useState("");
  const [ssoDomain, setSsoDomain] = useState("");

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    loadOrganizations();
  }, [session, router]);

  async function loadOrganizations() {
    try {
      // Use the raw fetch to hit the organization API
      const response = await fetch("/api/organization");
      const data = (await response.json()) as { organizations?: Organization[] };
      const orgList = data?.organizations ?? [];
      setOrganizations(orgList);

      if (orgList.length > 0) {
        const active = orgList[0];
        setActiveOrg(active);
        await loadMembers(active.id);
      }
    } catch {
      // Organizations may not be set up yet
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers(orgId: string) {
    try {
      // Use the raw fetch to avoid strict type issues with the client SDK
      const response = await fetch(
        `/api/organization?organizationId=${orgId}`,
      );
      const data = (await response.json()) as { members?: Member[] };
      setMembers(data?.members ?? []);
    } catch {
      // Silent fail
    }
  }

  async function createOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;

    try {
      const response = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          slug: orgName.trim().toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (!response.ok) {
        toast.error("Failed to create organization");
        return;
      }

      toast.success("Organization created!");
      setOrgName("");
      await loadOrganizations();
    } catch {
      toast.error("Failed to create organization");
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrg || !inviteEmail.trim()) return;

    try {
      const response = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrg.id,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to send invitation");
        return;
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      await loadMembers(activeOrg.id);
    } catch {
      toast.error("Failed to send invitation");
    }
  }

  async function removeMember(memberId: string) {
    if (!activeOrg) return;

    try {
      const response = await fetch(
        `/api/organization/member?organizationId=${activeOrg.id}&memberId=${memberId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        toast.error("Failed to remove member");
        return;
      }

      toast.success("Member removed");
      await loadMembers(activeOrg.id);
    } catch {
      toast.error("Failed to remove member");
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Settings</h1>

      {/* Organization Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium">Organization</h2>

        {organizations.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              You don&apos;t have an organization yet. Create one to manage your team.
            </p>
            <form onSubmit={createOrganization} className="flex gap-3">
              <input
                className="h-10 flex-1 rounded-lg border border-border/50 bg-muted/50 px-3 text-sm"
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
              >
                Create
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Active Organization Display */}
            <div className="mb-6 rounded-lg border border-border/50 bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{activeOrg?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Slug: {activeOrg?.slug}
                  </p>
                </div>
                <select
                  className="h-9 rounded-md border border-border/50 bg-muted/50 px-2 text-sm"
                  value={activeOrg?.id ?? ""}
                  onChange={(e) => {
                    const org = organizations.find((o) => o.id === e.target.value);
                    if (org) {
                      setActiveOrg(org);
                      loadMembers(org.id);
                    }
                  }}
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Members List */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Members ({members.length})
              </h3>
              <div className="rounded-lg border border-border/50 bg-card">
                {members.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No members yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {member.user?.name || member.user?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.user?.email} &middot; {member.role}
                          </p>
                        </div>
                        <button
                          className="text-xs text-destructive hover:underline"
                          onClick={() => removeMember(member.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Invite Member */}
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Invite Member</h3>
              <form onSubmit={inviteMember} className="flex gap-3">
                <input
                  className="h-10 flex-1 rounded-lg border border-border/50 bg-muted/50 px-3 text-sm"
                  placeholder="Email address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <select
                  className="h-9 rounded-md border border-border/50 bg-muted/50 px-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
                >
                  Invite
                </button>
              </form>
            </div>
          </>
        )}
      </section>

      {/* SSO Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium">Enterprise SSO</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Configure Single Sign-On for your organization using SAML or OIDC.
          Members with your organization&apos;s email domain will be routed to your
          identity provider.
        </p>

        <div className="rounded-lg border border-border/50 bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Add SSO Provider</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!ssoDomain.trim() || !ssoProvider.trim()) return;

              try {
                const response = await fetch("/api/sso", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    providerId: ssoProvider.trim(),
                    domain: ssoDomain.trim(),
                    organizationId: activeOrg?.id,
                  }),
                });

                if (!response.ok) {
                  toast.error("Failed to register SSO provider");
                  return;
                }

                toast.success("SSO provider registered!");
                setSsoProvider("");
                setSsoDomain("");
              } catch {
                toast.error("Failed to register SSO provider");
              }
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex gap-3">
              <input
                className="h-10 flex-1 rounded-lg border border-border/50 bg-muted/50 px-3 text-sm"
                placeholder="Provider name (e.g., Okta, Azure AD)"
                value={ssoProvider}
                onChange={(e) => setSsoProvider(e.target.value)}
                required
              />
              <input
                className="h-10 flex-1 rounded-lg border border-border/50 bg-muted/50 px-3 text-sm"
                placeholder="Email domain (e.g., company.com)"
                value={ssoDomain}
                onChange={(e) => setSsoDomain(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Register SSO Domain
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
