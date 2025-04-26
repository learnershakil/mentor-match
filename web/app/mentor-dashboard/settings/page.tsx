"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Check } from "lucide-react";

import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MentorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  interest: string;
  specialties: string[];
  company: string;
  jobTitle: string;
  experience: number;
  image: string;
  rating: number;
  reviewCount: number;
}

export default function MentorSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<MentorProfile | null>(null);
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
  const [pushNotifications, setPushNotifications] = useState({
    sessionReminders: true,
    newMessages: true,
    assignmentSubmissions: true,
  });
  const [availableDays, setAvailableDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const specialtyOptions = [
    { value: "WebDevelopment", label: "Web Development" },
    { value: "AiMl", label: "AI & Machine Learning" },
    { value: "AppDevelopment", label: "App Development" },
    { value: "CyberSecurity", label: "Cyber Security" },
    { value: "DataScience", label: "Data Science" },
    { value: "CloudComputing", label: "Cloud Computing" },
    { value: "DevOps", label: "DevOps" },
    { value: "UiUxDesign", label: "UI/UX Design" },
  ];

  useEffect(() => {
    fetchMentorProfile();
  }, []);

  const fetchMentorProfile = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching mentor profile...");

      const response = await fetch("/api/mentor/profile");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch mentor profile: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Log the entire response for debugging
      console.log("API Response data:", data);

      // Properly extract profile data with fallbacks
      setProfile({
        id: data.id || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        interest: data.interest || data.intrest || "WebDevelopment",
        specialties: Array.isArray(data.mentor?.specialties)
          ? data.mentor.specialties
          : data.specialties || [],
        company: data.mentor?.company || data.company || "",
        jobTitle: data.mentor?.jobTitle || data.jobTitle || "",
        experience: data.mentor?.experience ?? data.experience ?? 0,
        image: data.image || "/placeholder.svg",
        rating: data.mentor?.rating ?? data.rating ?? 0,
        reviewCount: data.mentor?.reviewCount ?? data.reviewCount ?? 0,
      });

      if (data.availability) {
        try {
          const availabilityData =
            typeof data.availability === "string"
              ? JSON.parse(data.availability)
              : data.availability;
          if (availabilityData.days) {
            setAvailableDays(availabilityData.days);
          }

          if (availabilityData.notificationSettings) {
            if (availabilityData.notificationSettings.emailNotifications) {
              setEmailNotifications(
                availabilityData.notificationSettings.emailNotifications
              );
            }
            if (availabilityData.notificationSettings.pushNotifications) {
              setPushNotifications(
                availabilityData.notificationSettings.pushNotifications
              );
            }
          }
        } catch (e) {
          console.error("Error parsing availability data:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching mentor profile:", error);
      toast.error("Failed to load profile data. Please try again.");

      // Set default profile with empty values to prevent UI errors
      setProfile({
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        interest: "WebDevelopment",
        specialties: [],
        company: "",
        jobTitle: "",
        experience: 0,
        image: "/placeholder.svg",
        rating: 0,
        reviewCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const maxSize = 5 * 1024 * 1024;
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

  const handleProfileUpdate = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      let imageUrl = profile.image;

      if (isImageChanged) {
        if (profileImage) {
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
            console.log("Image uploaded successfully:", imageUrl);
            toast.success("Image uploaded successfully");
          } catch (error) {
            console.error("Error uploading image:", error);
            toast.error(
              error instanceof Error ? error.message : "Failed to upload image"
            );
          }
        } else if (profileImagePreview) {
          imageUrl = profileImagePreview;
        }
      }

      // Prepare update payload
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        interest: profile.interest,
        intrest: profile.interest, // Support both spellings for backward compatibility
        specialties: profile.specialties,
        company: profile.company,
        jobTitle: profile.jobTitle,
        experience: profile.experience,
        image: imageUrl,
        availability: JSON.stringify({
          days: availableDays,
          notificationSettings: {
            emailNotifications,
            pushNotifications,
          },
        }),
      };

      console.log("Updating profile with data:", payload);

      const response = await fetch("/api/mentor/profile", {
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

      const responseData = await response.json();
      console.log("Profile updated successfully:", responseData);

      toast.success("Profile updated successfully");
      setIsImageChanged(false);

      // Refetch profile to show updated data
      await fetchMentorProfile();
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
      const response = await fetch("/api/mentor/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
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
        <div className="h-10 w-1/4 rounded-md bg-muted animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
        <div className="h-10 rounded-md bg-muted animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading="Settings"
        text="Manage your profile, account settings, and preferences"
      />
      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="mentoring">Mentoring</TabsTrigger>
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
                          : "?"}
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

                  {/* Debug info - can be removed in production */}
                  {/* {process.env.NODE_ENV === "development" && (
                    <div className="p-2 text-xs border rounded bg-muted">
                      <p>Debug - Profile Data:</p>
                      <pre>
                        {JSON.stringify(
                          {
                            firstName: profile?.firstName,
                            lastName: profile?.lastName,
                            email: profile?.email,
                            image: profile?.image,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )} */}

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
                      placeholder="Tell students about yourself and your expertise"
                      className="min-h-[120px]"
                      value={profile?.bio || ""}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, bio: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interest">Primary Expertise</Label>
                    <Select
                      value={profile?.interest || "WebDevelopment"}
                      onValueChange={(value) =>
                        setProfile((prev) =>
                          prev ? { ...prev, interest: value } : prev
                        )
                      }
                    >
                      <SelectTrigger id="interest">
                        <SelectValue placeholder="Select your primary expertise" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialtyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Specialties (select multiple)</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {specialtyOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`specialty-${option.value}`}
                            checked={profile?.specialties.includes(
                              option.value
                            )}
                            onCheckedChange={(checked) => {
                              if (!profile) return;
                              setProfile((prev) => {
                                if (!prev) return prev;
                                const specialties = [...prev.specialties];
                                if (checked) {
                                  if (!specialties.includes(option.value)) {
                                    specialties.push(option.value);
                                  }
                                } else {
                                  const index = specialties.indexOf(
                                    option.value
                                  );
                                  if (index > -1) {
                                    specialties.splice(index, 1);
                                  }
                                }
                                return { ...prev, specialties };
                              });
                            }}
                          />
                          <Label
                            htmlFor={`specialty-${option.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company/Organization</Label>
                      <Input
                        id="company"
                        value={profile?.company || ""}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, company: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={profile?.jobTitle || ""}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, jobTitle: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select
                      value={profile?.experience?.toString() || ""}
                      onValueChange={(value) =>
                        setProfile((prev) =>
                          prev ? { ...prev, experience: parseInt(value) } : prev
                        )
                      }
                    >
                      <SelectTrigger id="experience">
                        <SelectValue placeholder="Select years of experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(21)].map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i} {i === 1 ? "year" : "years"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleProfileUpdate}
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
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
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
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Connect your accounts for a seamless experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your Google account
                    </p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your GitHub account
                    </p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Twitter</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your Twitter account
                    </p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </CardContent>
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
                        Assignment Submissions
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when students submit assignments
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
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Push Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-sessions">Session Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive reminders about upcoming mentoring sessions
                      </p>
                    </div>
                    <Switch
                      id="push-sessions"
                      checked={pushNotifications.sessionReminders}
                      onCheckedChange={(checked) =>
                        setPushNotifications((prev) => ({
                          ...prev,
                          sessionReminders: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-messages">New Messages</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when you get new messages
                      </p>
                    </div>
                    <Switch
                      id="push-messages"
                      checked={pushNotifications.newMessages}
                      onCheckedChange={(checked) =>
                        setPushNotifications((prev) => ({
                          ...prev,
                          newMessages: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-assignments">
                        Assignment Submissions
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when students submit assignments
                      </p>
                    </div>
                    <Switch
                      id="push-assignments"
                      checked={pushNotifications.assignmentSubmissions}
                      onCheckedChange={(checked) =>
                        setPushNotifications((prev) => ({
                          ...prev,
                          assignmentSubmissions: checked,
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
                  "Save Notification Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="availability" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>
                Set your availability for mentoring sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Available Days</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {Object.entries(availableDays).map(([day, isAvailable]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={isAvailable}
                        onCheckedChange={(checked) =>
                          setAvailableDays((prev) => ({
                            ...prev,
                            [day]: !!checked,
                          }))
                        }
                      />
                      <Label htmlFor={`day-${day}`} className="capitalize">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Time Slots</h3>
                <p className="text-sm text-muted-foreground">
                  You can set specific time slots for each day in the Calendar
                  section.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/mentor-dashboard/calendar")}
                >
                  Manage Calendar
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Availability"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="mentoring" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Mentoring Preferences</CardTitle>
              <CardDescription>
                Customize your mentoring style and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Session Preferences</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="session-duration">
                      Default Session Duration
                    </Label>
                    <Select defaultValue="60">
                      <SelectTrigger id="session-duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="session-buffer">
                      Buffer Time Between Sessions
                    </Label>
                    <Select defaultValue="15">
                      <SelectTrigger id="session-buffer">
                        <SelectValue placeholder="Select buffer time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No buffer</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  Student Matching Preferences
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-match">
                        Automatic Student Matching
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Allow the platform to match you with students based on
                        your expertise
                      </p>
                    </div>
                    <Switch id="auto-match" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="student-requests">Student Requests</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow students to request you as their mentor
                      </p>
                    </div>
                    <Switch id="student-requests" defaultChecked />
                  </div>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="max-students">
                      Maximum Number of Students
                    </Label>
                    <Select defaultValue="10">
                      <SelectTrigger id="max-students">
                        <SelectValue placeholder="Select maximum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 students</SelectItem>
                        <SelectItem value="10">10 students</SelectItem>
                        <SelectItem value="15">15 students</SelectItem>
                        <SelectItem value="20">20 students</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Tools & Integrations</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center rounded-lg border p-4">
                    <div className="flex-1">
                      <h4 className="font-medium">Zoom Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically create Zoom links for your sessions
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                  <div className="flex items-center rounded-lg border p-4">
                    <div className="flex-1">
                      <h4 className="font-medium">Google Calendar</h4>
                      <p className="text-sm text-muted-foreground">
                        Sync your mentor sessions with Google Calendar
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <ChatbotCard />
    </MentorDashboardShell>
  );
}
