export type GoogleCalendarSourceType =
  | "RESERVATION"
  | "BOAT_SCHEDULE"
  | "STAFF_SCHEDULE";

export type GoogleCalendarSyncMapping = {
  sourceType: GoogleCalendarSourceType;
  sourceId: string;
  eventId: string;
  checksum: string;
  syncedAt: string;
};

export type GoogleCalendarSyncMappingInput = {
  sourceType: GoogleCalendarSourceType;
  sourceId: string;
  eventId: string;
  checksum: string;
};

export type GoogleCalendarSyncMappingRepository = {
  findBySource(
    sourceType: GoogleCalendarSourceType,
    sourceId: string,
  ): Promise<GoogleCalendarSyncMapping | null>;

  upsert(
    input: GoogleCalendarSyncMappingInput,
  ): Promise<GoogleCalendarSyncMapping>;
};

export type GoogleCalendarEventPayload = {
  summary: string;
  description?: string;
  location?: string;
  colorId?: string;
  start:
    | {
        date: string;
      }
    | {
        dateTime: string;
        timeZone: string;
      };
  end:
    | {
        date: string;
      }
    | {
        dateTime: string;
        timeZone: string;
      };
  extendedProperties: {
    private: {
      sourceType: GoogleCalendarSourceType;
      sourceId: string;
    };
  };
};

export type GoogleCalendarSyncItem = {
  sourceType: GoogleCalendarSourceType;
  sourceId: string;
  checksum: string;
  event: GoogleCalendarEventPayload;
};

export type GoogleCalendarSyncItemResult = {
  sourceType: GoogleCalendarSourceType;
  sourceId: string;
  status: "created" | "updated" | "skipped" | "failed";
  eventId?: string;
  message?: string;
};

export type GoogleCalendarSyncResult = {
  ok: boolean;
  calendarId?: string;
  message?: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: GoogleCalendarSyncItemResult[];
};
