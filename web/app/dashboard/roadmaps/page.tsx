import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatbotCard } from "@/components/dashboard/chatbot-card"
import { NotificationsButton } from "@/components/dashboard/notifications-button"
import { FullStackRoadmap } from "@/components/roadmaps/full-stack-roadmap"
import { AiMlRoadmap } from "@/components/roadmaps/ai-ml-roadmap"
import { AppDeveloperRoadmap } from "@/components/roadmaps/app-developer-roadmap"
import { CybersecurityRoadmap } from "@/components/roadmaps/cybersecurity-roadmap"

export default function RoadmapsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Learning Roadmaps" text="Follow structured paths to master new skills">
        <NotificationsButton />
      </DashboardHeader>

      <Tabs defaultValue="fullstack" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="fullstack">Full Stack Developer</TabsTrigger>
          <TabsTrigger value="aiml">AI/ML</TabsTrigger>
          <TabsTrigger value="appdev">App Developer</TabsTrigger>
          <TabsTrigger value="cybersecurity">Cyber Security</TabsTrigger>
        </TabsList>

        <TabsContent value="fullstack" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Full Stack Developer Roadmap</CardTitle>
              <CardDescription>
                Master both frontend and backend technologies to become a complete developer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FullStackRoadmap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aiml" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>AI/ML Roadmap</CardTitle>
              <CardDescription>Learn machine learning and artificial intelligence fundamentals</CardDescription>
            </CardHeader>
            <CardContent>
              <AiMlRoadmap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appdev" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>App Developer Roadmap</CardTitle>
              <CardDescription>Master mobile app development for iOS and Android</CardDescription>
            </CardHeader>
            <CardContent>
              <AppDeveloperRoadmap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cybersecurity" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Cybersecurity Roadmap</CardTitle>
              <CardDescription>Learn to protect systems and networks from digital attacks</CardDescription>
            </CardHeader>
            <CardContent>
              <CybersecurityRoadmap />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ChatbotCard />
    </DashboardShell>
  )
}

