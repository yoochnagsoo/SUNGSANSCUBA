import { NextResponse } from "next/server";

import {
  createGroupDiveStatementWorkbook,
  getGroupDiveStatementFileName,
} from "@/lib/groupDives/groupDiveStatementWorkbook";
import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(
    /['()]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16)}`,
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const repository = getGroupDiveRepository();
    const groupDive = await repository.findById(id);

    if (!groupDive) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "그룹 다이빙 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const workbook =
      await createGroupDiveStatementWorkbook(groupDive);
    const fileName =
      getGroupDiveStatementFileName(groupDive);

    return new Response(new Uint8Array(workbook), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(
          fileName,
        )}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Failed to create group dive statement:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 내역서를 생성하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
