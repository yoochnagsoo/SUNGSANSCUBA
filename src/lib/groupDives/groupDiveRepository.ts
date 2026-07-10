import { dynamoGroupDiveRepository } from "./dynamoGroupDiveRepository";
import { memoryGroupDiveRepository } from "./memoryGroupDiveRepository";

const useDynamoDb =
  process.env.GROUP_DIVE_REPOSITORY ===
    "dynamodb" ||
  process.env.NODE_ENV === "production";

export const groupDiveRepository = useDynamoDb
  ? dynamoGroupDiveRepository
  : memoryGroupDiveRepository;

export function getGroupDiveRepository() {
  return groupDiveRepository;
}

export type {
  GroupDive,
  GroupDiveBillingType,
  GroupDiveInput,
  GroupDiveParticipant,
  GroupDiveParticipantInput,
  GroupDiveParticipantUpdateInput,
  GroupDiveRepository,
  GroupDiveStatus,
  GroupDiveTrip,
  GroupDiveTripInput,
  GroupDiveTripParticipant,
  GroupDiveTripStatus,
  GroupDiveTripUpdateInput,
  GroupDiveUpdateInput,
} from "./types";