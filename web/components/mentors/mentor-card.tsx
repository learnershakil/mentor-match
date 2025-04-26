"use client"

import { useState } from "react"
import Image from "next/image"
import { Calendar, Clock, MessageSquare, Star, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScheduleSessionModal } from "@/components/mentors/schedule-session-modal"

interface MentorCardProps {
  mentor: {
    id: number
    name: string
    role: string
    company: string
    image: string
    bio: string
    rating: number
    reviews: number
    specialties: string[]
    availability?: {
      day: string
      slots: string[]
    }[]
    nextSession?: {
      title: string
      date: string
      time: string
    }
  }
}

export function MentorCard({ mentor }: MentorCardProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  return (
    <>
      <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl bg-[#F5EFF7]">
      <div className="md:flex relative">
        <div className="md:w-1/3 lg:w-1/4 relative z-0">
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-[#A3779D]/20 to-[#663399]/10 md:h-full">
          <Image
          src={mentor.image || "/placeholder.svg"}
          alt={mentor.name}
          width={300}
          height={300}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
        </div>
        <div className="flex-1 p-6 md:ml-[110px] relative z-10 bg-[#F5EFF7]/95 rounded-l-3xl shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
          <h3 className="text-xl font-bold text-[#2E1A47]">{mentor.name}</h3>
          <p className="text-sm font-medium text-[#663399]">
            {mentor.role} at {mentor.company}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(mentor.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"
              }`}
              />
            ))}
            </div>
            <span className="ml-1 text-sm font-medium">
            {mentor.rating} <span className="text-gray-500">({mentor.reviews} reviews)</span>
            </span>
          </div>
          </div>
          <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            className="gap-1 bg-indigo-600 hover:bg-indigo-700 transition-colors" 
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Video className="h-4 w-4" />
            <span>Schedule Session</span>
          </Button>
          <Button size="sm" variant="outline" className="gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            <MessageSquare className="h-4 w-4" />
            <span>Message</span>
          </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm leading-relaxed text-gray-600">{mentor.bio}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {mentor.specialties.map((specialty) => (
          <Badge key={specialty} variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
            {specialty}
          </Badge>
          ))}
        </div>

        {mentor.nextSession && (
          <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700">Next Session</h4>
          <div className="mt-2 rounded-md border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white p-4 shadow-sm">
            <div className="font-medium text-gray-800">{mentor.nextSession.title}</div>
            <div className="mt-2 flex items-center gap-5 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>{mentor.nextSession.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>{mentor.nextSession.time}</span>
            </div>
            </div>
            <div className="mt-3 flex gap-2">
            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
              <Video className="h-3.5 w-3.5" />
              <span>Join Session</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1 border-gray-200">
              <Calendar className="h-3.5 w-3.5" />
              <span>Reschedule</span>
            </Button>
            </div>
          </div>
          </div>
        )}

        {mentor.availability && (
          <div className="mt-5">
          <h4 className="text-sm font-medium text-gray-700">Availability</h4>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {mentor.availability.map((slot) => (
            <div key={slot.day} className="rounded-md border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50">
              <div className="font-medium text-gray-800">{slot.day}</div>
              <div className="mt-1.5 space-y-1.5">
              {slot.slots.map((time) => (
                <div key={time} className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3 w-3 text-indigo-400" />
                <span>{time}</span>
                </div>
              ))}
              </div>
            </div>
            ))}
          </div>
          </div>
        )}
        </div>
      </div>
      </Card>

      <ScheduleSessionModal
      mentor={mentor}
      isOpen={isScheduleModalOpen}
      onClose={() => setIsScheduleModalOpen(false)}
      />
    </>
  )
}

