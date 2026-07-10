export type VisitorDeviceType = "MOBILE" | "TABLET" | "DESKTOP" | "UNKNOWN";

export type VisitorLog = {
  id: string;
  visitorHash: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
  createdAt: string;
};

export type VisitorLogInput = {
  visitorHash: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
};

export type VisitorLogSummaryRecentLog = {
  id: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
  createdAt: string;
};

export type VisitorLogSummary = {
  totalVisits: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  monthVisits: number;
  monthUniqueVisitors: number;
  reservationPageVisits: number;
  mobileVisits: number;
  tabletVisits: number;
  desktopVisits: number;
  unknownDeviceVisits: number;
  topPages: Array<{
    path: string;
    count: number;
  }>;
  recentLogs: VisitorLogSummaryRecentLog[];
};

export type VisitorLogRepository = {
  create: (input: VisitorLogInput) => Promise<VisitorLog>;
  list: () => Promise<VisitorLog[]>;
  getSummary: () => Promise<VisitorLogSummary>;
};