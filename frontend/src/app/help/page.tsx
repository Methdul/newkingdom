'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
        <p className="text-muted-foreground">Find answers to common questions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Documentation and FAQs will be provided here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For now, please contact support if you need assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
