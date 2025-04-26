"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { NotificationsButton } from "@/components/dashboard/notifications-button";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  intrest: string;
  image: string;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState({
    sessionReminders: true,
    newMessages: true,
    assignmentSubmissions: true,
    platformUpdates: false,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();

      // Set profile data with fallbacks
      setProfile({
        id: data.id || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        intrest: data.intrest || "WebDevelopment",
        image: data.image || "/placeholder.svg",
      });

      // If there are notification settings in the profile, use them
      if (data.notificationSettings) {
        try {
          const notificationData =
            typeof data.notificationSettings === "string"
              ? JSON.parse(data.notificationSettings)
              : data.notificationSettings;

          if (notificationData.emailNotifications) {
            setEmailNotifications(notificationData.emailNotifications);
          }
        } catch (error) {
          console.error("Error parsing notification settings:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load profile data. Please try again.");

      // Set default profile with empty values to prevent UI errors
      setProfile({
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        intrest: "WebDevelopment",
        image: "/placeholder.svg",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("Image is too large. Maximum size is 5MB");
        return;
      }

      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed"
        );
        return;
      }

      setProfileImage(file);
      setIsImageChanged(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      let imageUrl = profile.image;

      // Handle image upload if changed
      if (isImageChanged && profileImage) {
        const formData = new FormData();
        formData.append("image", profileImage);

        try {
          toast.info("Uploading image...");
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "Failed to upload image");
          }

          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
          toast.success("Image uploaded successfully");
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image"
          );
        }
      }

      // Prepare update payload
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        intrest: profile.intrest,
        image: imageUrl,
        notificationSettings: JSON.stringify({
          emailNotifications,
        }),
      };

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setIsImageChanged(false);

      // Refetch profile to show updated data
      await fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/user/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification settings");
      }

      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("current-password") as string;
    const newPassword = formData.get("new-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      e.currentTarget.reset();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderLoadingState = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-10 w-1/4 rounded-md bg-muted animate-pulse"></div>
        <div className="h-10 w-1/2 rounded-md bg-muted animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
        <div className="h-40 rounded-md bg-muted animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences"
      >
        <NotificationsButton />
      </DashboardHeader>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and public profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                renderLoadingState()
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={
                          profileImagePreview ||
                          profile?.image ||
                          "/placeholder.svg?height=96&width=96"
                        }
                        alt={`${profile?.firstName || "User"} ${
                          profile?.lastName || "Profile"
                        }`}
                      />
                      <AvatarFallback>
                        {profile
                          ? `${profile.firstName.charAt(
                              0
                            )}${profile.lastName.charAt(0)}`
                          : "JD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="profile-image"
                        className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      >
                        Change Avatar
                        <input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">
                        JPG, GIF or PNG. Max size of 5MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile?.firstName || ""}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, firstName: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile?.lastName || ""}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, lastName: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, email: e.target.value } : prev
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile?.phone || ""}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, phone: e.target.value } : prev
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      className="min-h-[100px]"
                      value={profile?.bio || ""}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, bio: e.target.value } : prev
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="interests">Learning Interests</Label>
                    <Select
                      value={profile?.intrest || "WebDevelopment"}
                      onValueChange={(value) =>
                        setProfile((prev) =>
                          prev ? { ...prev, intrest: value } : prev
                        )
                      }
                    >
                      <SelectTrigger id="interests">
                        <SelectValue placeholder="Select your primary interest" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WebDevelopment">
                          Web Development
                        </SelectItem>
                        <SelectItem value="AiMl">AI/ML</SelectItem>
                        <SelectItem value="AppDevelopment">
                          App Development
                        </SelectItem>
                        <SelectItem value="CyberSecurity">
                          Cybersecurity
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveProfile}
                disabled={isLoading || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account credentials and security
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    name="current-password"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="rounded-lg border border-destructive/20 p-4">
                  <h3 className="font-medium text-destructive">
                    Delete Account
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all of your data
                  </p>
                  <Button variant="destructive" size="sm" className="mt-4">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Email Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-sessions">Session Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive reminders about upcoming mentoring sessions
                      </p>
                    </div>
                    <Switch
                      id="email-sessions"
                      checked={emailNotifications.sessionReminders}
                      onCheckedChange={(checked) =>
                        setEmailNotifications((prev) => ({
                          ...prev,
                          sessionReminders: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-messages">New Messages</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when you get new messages
                      </p>
                    </div>
                    <Switch
                      id="email-messages"
                      checked={emailNotifications.newMessages}
                      onCheckedChange={(checked) =>
                        setEmailNotifications((prev) => ({
                          ...prev,
                          newMessages: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-assignments">
                        Assignment Updates
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications about assignment feedback and
                        grades
                      </p>
                    </div>
                    <Switch
                      id="email-assignments"
                      checked={emailNotifications.assignmentSubmissions}
                      onCheckedChange={(checked) =>
                        setEmailNotifications((prev) => ({
                          ...prev,
                          assignmentSubmissions: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-updates">Platform Updates</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates about new features and improvements
                      </p>
                    </div>
                    <Switch
                      id="email-updates"
                      checked={emailNotifications.platformUpdates}
                      onCheckedChange={(checked) =>
                        setEmailNotifications((prev) => ({
                          ...prev,
                          platformUpdates: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleNotificationSettingsUpdate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the platform looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="bg-background p-2">
                      <div className="space-y-2 rounded-md bg-primary/20 p-2">
                        <div className="h-2 w-3/4 rounded-lg bg-primary/30" />
                        <div className="h-2 w-1/2 rounded-lg bg-primary/30" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t p-2">
                      <span className="text-xs">Light</span>
                      <Switch id="theme-light" defaultChecked />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border">
                    <div className="bg-zinc-950 p-2">
                      <div className="space-y-2 rounded-md bg-primary/20 p-2">
                        <div className="h-2 w-3/4 rounded-lg bg-primary/30" />
                        <div className="h-2 w-1/2 rounded-lg bg-primary/30" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t p-2">
                      <span className="text-xs">Dark</span>
                      <Switch id="theme-dark" />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border">
                    <div className="bg-gradient-to-b from-background to-zinc-950 p-2">
                      <div className="space-y-2 rounded-md bg-primary/20 p-2">
                        <div className="h-2 w-3/4 rounded-lg bg-primary/30" />
                        <div className="h-2 w-1/2 rounded-lg bg-primary/30" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t p-2">
                      <span className="text-xs">System</span>
                      <Switch id="theme-system" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Font Size</h3>
                <div className="grid gap-2">
                  <Select defaultValue="medium">
                    <SelectTrigger id="font-size">
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveProfile}
                disabled={isLoading || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Pro Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      $29/month, billed monthly
                    </p>
                  </div>
                  <Badge>Current Plan</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Unlimited mentor browsing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>4 mentor sessions per month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Access to all learning resources</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="destructive">Cancel Subscription</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-12 rounded bg-muted" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-xs text-muted-foreground">
                        Expires 12/2025
                      </p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Pro Plan - Monthly</p>
                    <p className="text-sm text-muted-foreground">
                      March 1, 2025
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.00</p>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Download
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Pro Plan - Monthly</p>
                    <p className="text-sm text-muted-foreground">
                      February 1, 2025
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.00</p>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Download
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Pro Plan - Monthly</p>
                    <p className="text-sm text-muted-foreground">
                      January 1, 2025
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.00</p>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ChatbotCard />
    </DashboardShell>
  );
}
