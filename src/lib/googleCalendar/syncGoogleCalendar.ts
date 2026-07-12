import {
  createGoogleCalendarEvent,
  getGoogleCalendarId,
  updateGoogleCalendarEvent,
} from "./googleCalendarClient";
import { googleCalendarMappingRepository } from "./googleCalendarMappingRepository";
import type {
  GoogleCalendarSyncItem,
  GoogleCalendarSyncItemResult,
  GoogleCalendarSyncResult,
} from "./types";

export async function syncGoogleCalendarItems(
  items: GoogleCalendarSyncItem[],
): Promise<GoogleCalendarSyncResult> {
  const calendarId = getGoogleCalendarId();
  const results: GoogleCalendarSyncItemResult[] = [];

  for (const item of items) {
    try {
      const mapping =
        await googleCalendarMappingRepository.findBySource(
          item.sourceType,
          item.sourceId,
        );

      if (mapping && mapping.checksum === item.checksum) {
        results.push({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          status: "skipped",
          eventId: mapping.eventId,
        });
        continue;
      }

      const eventId = mapping
        ? await updateGoogleCalendarEvent(
            calendarId,
            mapping.eventId,
            item.event,
          )
        : await createGoogleCalendarEvent(calendarId, item.event);

      await googleCalendarMappingRepository.upsert({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        eventId,
        checksum: item.checksum,
      });

      results.push({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        status: mapping ? "updated" : "created",
        eventId,
      });
    } catch (error) {
      results.push({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Unknown Google Calendar sync error.",
      });
    }
  }

  const created = results.filter((item) => item.status === "created").length;
  const updated = results.filter((item) => item.status === "updated").length;
  const skipped = results.filter((item) => item.status === "skipped").length;
  const failed = results.filter((item) => item.status === "failed").length;
  const failedMessages = Array.from(
    new Set(
      results
        .filter((item) => item.status === "failed" && item.message)
        .map((item) => item.message as string),
    ),
  );

  return {
    ok: failed === 0,
    calendarId,
    message:
      failed > 0
        ? `Google 캘린더 동기화 중 ${failed}건이 실패했습니다. ${failedMessages
            .slice(0, 3)
            .join(" / ")}`
        : undefined,
    total: results.length,
    created,
    updated,
    skipped,
    failed,
    results,
  };
}
