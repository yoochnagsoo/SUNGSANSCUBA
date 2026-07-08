export const env = {
  reservationStorage: process.env.RESERVATION_STORAGE || "memory",
  awsRegion: process.env.AWS_REGION || "ap-northeast-2",
  reservationsTableName:
    process.env.RESERVATIONS_TABLE_NAME || "sungsan-scuba-reservations",
};