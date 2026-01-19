import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function UserWelcome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware guarantees user exists on protected routes
  if (!user) {
    return <h1 className="text-3xl font-bold">Welcome!</h1>;
  }

  // Fetch user profile for personalized welcome
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('experience_level, target_role, custom_role')
    .eq('user_id', user.id)
    .single()

  // Format experience level for display
  const experienceLevelText = profile?.experience_level === 'student'
    ? 'Student/Recent Graduate'
    : profile?.experience_level === 'career_changer'
    ? 'Career Changer'
    : null

  // Use custom role if set, otherwise use target role
  const roleText = profile?.custom_role || profile?.target_role

  return (
    <div>
      <h1 className="text-3xl font-bold" data-testid="dashboard-header">
        Welcome{user.email ? `, ${user.email.split("@")[0]}` : ""}!
      </h1>
      {profile && (experienceLevelText || roleText) && (
        <p className="text-muted-foreground mt-2">
          {experienceLevelText && roleText
            ? `${experienceLevelText} • ${roleText}`
            : experienceLevelText || roleText}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<h1 className="text-3xl font-bold">Welcome!</h1>}>
        <UserWelcome />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Your latest resume analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No scans yet. Create your first scan to get started!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ATS Score</CardTitle>
            <CardDescription>Average score across all scans</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">--</p>
            <p className="text-xs text-muted-foreground mt-2">
              Complete a scan to see your score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with CoopReady</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Upload your resume</p>
            <p className="text-sm">• Add a job description</p>
            <p className="text-sm">• Get instant feedback</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            CoopReady helps you optimize your resume for tech co-ops and internships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click &quot;New Scan&quot; in the sidebar to begin</li>
            <li>Upload your resume (PDF or DOCX)</li>
            <li>Paste the job description you&apos;re targeting</li>
            <li>Review your ATS score and personalized suggestions</li>
            <li>Accept or reject suggestions to optimize your resume</li>
            <li>Download your improved resume</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
