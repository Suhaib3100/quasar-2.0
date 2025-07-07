import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModActionsTable } from "@/components/moderation/mod-actions-table"
import { UserManagement } from "@/components/moderation/user-management"
import { WarningSystem } from "@/components/moderation/warning-system"
import { ModSettings } from "@/components/moderation/mod-settings"

export const metadata: Metadata = {
  title: "Moderation Dashboard",
  description: "Manage server moderation and user actions",
}

export default function ModerationPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Moderation Dashboard</h2>
          <p className="text-muted-foreground">
            Manage server moderation, user actions, and moderation settings
          </p>
        </div>
        <Tabs defaultValue="actions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="actions">Action History</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="warnings">Warnings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Moderation Actions</CardTitle>
                <CardDescription>
                  View and manage recent moderation actions taken on the server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModActionsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage user roles, permissions, and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="warnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Warning System</CardTitle>
                <CardDescription>
                  Manage user warnings and automated actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WarningSystem />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Settings</CardTitle>
                <CardDescription>
                  Configure moderation rules and automated actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
