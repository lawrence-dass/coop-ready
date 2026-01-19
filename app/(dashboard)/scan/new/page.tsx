import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewScanPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Scan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume & Job Description</CardTitle>
          <CardDescription>
            Get instant ATS feedback and optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will contain the resume upload and job description input form.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
