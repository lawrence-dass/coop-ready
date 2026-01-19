import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Scan History</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Resume Scans</CardTitle>
          <CardDescription>
            View and manage your past resume analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will display a list of all your previous scans.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
