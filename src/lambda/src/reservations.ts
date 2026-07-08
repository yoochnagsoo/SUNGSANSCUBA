import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

type ReservationStatus = "pending" | "confirmed" | "cancelled";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  program: string;
  date: string;
  people: string;
  message: string;
  status: ReservationStatus;
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
};

const TABLE_NAME =
  process.env.RESERVATIONS_TABLE_NAME || "SungsanScubaReservations";

const dynamoClient = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(dynamoClient);

const allowedStatuses: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
];

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === "OPTIONS") {
      return response(200, {});
    }

    if (method === "GET" && path.endsWith("/reservations")) {
      return await getReservations();
    }

    if (method === "POST" && path.endsWith("/reservations")) {
      return await createReservation(event);
    }

    const id = event.pathParameters?.id;

    if (!id) {
      return response(404, {
        ok: false,
        message: "Not found",
      });
    }

    if (method === "PATCH") {
      return await updateReservation(id, event);
    }

    if (method === "DELETE") {
      return await deleteReservation(id);
    }

    return response(405, {
      ok: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error(error);

    return response(500, {
      ok: false,
      message: "Internal server error",
    });
  }
}

async function getReservations() {
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  const reservations = (result.Items || []) as Reservation[];

  reservations.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return response(200, {
    ok: true,
    reservations,
  });
}

async function createReservation(event: APIGatewayProxyEventV2) {
  const body = parseBody(event.body);

  const requiredFields = [
    "name",
    "phone",
    "email",
    "program",
    "date",
    "people",
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return response(400, {
        ok: false,
        message: `${field} is required`,
      });
    }
  }

  const now = new Date().toISOString();

  const reservation: Reservation = {
    id: crypto.randomUUID(),
    name: String(body.name),
    phone: String(body.phone),
    email: String(body.email),
    program: String(body.program),
    date: String(body.date),
    people: String(body.people),
    message: String(body.message || ""),
    status: "pending",
    adminMemo: "",
    createdAt: now,
    updatedAt: now,
  };

  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: reservation,
    })
  );

  return response(201, {
    ok: true,
    reservation,
  });
}

async function updateReservation(
  id: string,
  event: APIGatewayProxyEventV2
) {
  const body = parseBody(event.body);

  if (body.status && !allowedStatuses.includes(body.status)) {
    return response(400, {
      ok: false,
      message: "Invalid status",
    });
  }

  const updateParts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  updateParts.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";

  if (body.status) {
    updateParts.push("#status = :status");
    names["#status"] = "status";
    values[":status"] = body.status;
  }

  if (typeof body.adminMemo === "string") {
    updateParts.push("#adminMemo = :adminMemo");
    names["#adminMemo"] = "adminMemo";
    values[":adminMemo"] = body.adminMemo;
  }

  const result = await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updateParts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );

  return response(200, {
    ok: true,
    reservation: result.Attributes,
  });
}

async function deleteReservation(id: string) {
  await db.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  return response(200, {
    ok: true,
  });
}

function parseBody(body?: string): Record<string, any> {
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify(body),
  };
}