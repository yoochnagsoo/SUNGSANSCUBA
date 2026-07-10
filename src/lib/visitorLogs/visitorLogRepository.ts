import { dynamoVisitorLogRepository } from "./dynamoVisitorLogRepository";
import type { VisitorLogRepository } from "./types";

export const visitorLogRepository: VisitorLogRepository =
  dynamoVisitorLogRepository;