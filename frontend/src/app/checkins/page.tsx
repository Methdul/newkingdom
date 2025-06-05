'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckInsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Check-ins</h2>
        <p className="text-muted-foreground">Record and manage member check-ins</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>
            Functionality for managing check-ins will be added here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check back later for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
