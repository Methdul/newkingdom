'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Membership Plans</h2>
        <p className="text-muted-foreground">Create and manage membership plans</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>
            Tools for managing plans will appear here soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Development is in progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
