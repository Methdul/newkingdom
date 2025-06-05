'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Promotions</h2>
        <p className="text-muted-foreground">Manage promotional campaigns and offers</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>
            Promotion management features will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
