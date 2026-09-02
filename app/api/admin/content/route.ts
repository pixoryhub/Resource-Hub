// Admin-only writes for site content (resources, calendar events, Creator
// Hub videos) — see lib/data/content.ts. One endpoint for all three
// content types to avoid three near-identical route files; `type` picks
// which, `action` picks add/update/delete/reorder.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import * as content from "@/lib/data/content";
import { deleteVideo } from "@/lib/videoStore";
import type { Resource, CalendarEvent, HubVideo, WeeklyOpportunity, Testimonial, TopPost } from "@/lib/data/types";

function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const type = body?.type;
  const action = body?.action;

  try {
    if (type === "resources") {
      if (action === "add") await content.addResource(body.item as Resource);
      else if (action === "update") await content.updateResource(body.id, body.patch as Partial<Resource>);
      else if (action === "delete") await content.deleteResource(body.id);
      else if (action === "reorder") await content.setResourcePositions(body.positions);
      else return badRequest("Unknown action for resources.");
    } else if (type === "events") {
      if (action === "add") await content.addEvent(body.item as CalendarEvent);
      else if (action === "update") await content.updateEvent(body.id, body.patch as Partial<CalendarEvent>);
      else if (action === "delete") await content.deleteEvent(body.id);
      else return badRequest("Unknown action for events.");
    } else if (type === "hubVideos") {
      if (action === "add") await content.addHubVideo(body.item as HubVideo);
      else if (action === "update") await content.updateHubVideo(body.id, body.patch as Partial<HubVideo>);
      else if (action === "delete") await content.deleteHubVideo(body.id);
      else if (action === "reorder") await content.setHubVideoPositions(body.positions);
      else return badRequest("Unknown action for hubVideos.");
    } else if (type === "weeklyOpportunity") {
      if (action === "save") await content.saveWeeklyOpportunity(body.value as WeeklyOpportunity);
      else return badRequest("Unknown action for weeklyOpportunity.");
    } else if (type === "topPosts") {
      if (action === "add") await content.addTopPost(body.item as TopPost);
      else if (action === "update") await content.updateTopPost(body.id, body.patch as Partial<TopPost>);
      else if (action === "delete") await content.deleteTopPost(body.id);
      else if (action === "reorder") await content.setTopPostPositions(body.positions);
      else return badRequest("Unknown action for topPosts.");
    } else if (type === "testimonials") {
      if (action === "add") await content.addTestimonial(body.item as Testimonial);
      else if (action === "update") await content.updateTestimonial(body.id, body.patch as Partial<Testimonial>);
      else if (action === "delete") {
        await content.deleteTestimonial(body.id);
        if (typeof body.videoAssetId === "string") await deleteVideo(body.videoAssetId).catch(() => {});
      } else return badRequest("Unknown action for testimonials.");
    } else {
      return badRequest("Unknown content type.");
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
