import { ZipArchive } from "archiver";

import type {
  GroupDive,
  GroupDiveTrip,
} from "@/lib/groupDives/types";

type CellValue = {
  value?: string | number;
  formula?: string;
  style?: number;
};

type WorksheetModel = {
  cells: Map<string, CellValue>;
  merges: string[];
  maxRow: number;
};

const LAST_COLUMN = "G";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnToNumber(column: string) {
  return column
    .split("")
    .reduce(
      (total, char) =>
        total * 26 + char.charCodeAt(0) - 64,
      0,
    );
}

function cellRef(column: string, row: number) {
  return `${column}${row}`;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${year}.${month}.${day}.`;
}

function formatPeriod(startDate: string, endDate: string) {
  if (!startDate && !endDate) {
    return "";
  }

  if (!startDate || !endDate || startDate === endDate) {
    return formatDate(startDate || endDate);
  }

  const [startYear, startMonth, startDay] =
    startDate.split("-");
  const [endYear, endMonth, endDay] = endDate.split("-");

  if (
    startYear &&
    startMonth &&
    startDay &&
    endYear &&
    endMonth &&
    endDay &&
    startYear === endYear &&
    startMonth === endMonth
  ) {
    return `${startYear}.${startMonth}.${startDay}~${endDay}.`;
  }

  return `${formatDate(startDate)}~${formatDate(endDate)}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function getTripBoardedCount(trip: GroupDiveTrip) {
  if (
    typeof trip.boardedCount === "number" &&
    Number.isFinite(trip.boardedCount)
  ) {
    return Math.max(Math.floor(trip.boardedCount), 0);
  }

  return trip.participants.filter(
    (participant) => participant.boarded,
  ).length;
}

function getTripFocCount(trip: GroupDiveTrip) {
  if (
    typeof trip.focCount === "number" &&
    Number.isFinite(trip.focCount)
  ) {
    return Math.max(Math.floor(trip.focCount), 0);
  }

  return 0;
}

function getTripUnitPrice(
  trip: GroupDiveTrip,
  defaultDiveUnitPrice?: number,
) {
  const participantPrice = trip.participants.find(
    (participant) =>
      typeof participant.unitPrice === "number" &&
      Number.isFinite(participant.unitPrice),
  )?.unitPrice;

  return (
    participantPrice ??
    trip.unitPrice ??
    defaultDiveUnitPrice ??
    0
  );
}

function getTripName(trip: GroupDiveTrip) {
  return trip.boatName || trip.actualDepartureTime
    ? "보트다이빙"
    : "비치다이빙";
}

function isBillableTrip(trip: GroupDiveTrip) {
  return (
    trip.status !== "CANCELLED" &&
    trip.status !== "WEATHER_CANCELLED"
  );
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function setCell(
  worksheet: WorksheetModel,
  column: string,
  row: number,
  cell: CellValue,
) {
  worksheet.cells.set(cellRef(column, row), cell);
  worksheet.maxRow = Math.max(worksheet.maxRow, row);
}

function merge(worksheet: WorksheetModel, range: string) {
  worksheet.merges.push(range);
}

function sumFormula(refs: string[]) {
  if (refs.length === 0) {
    return "0";
  }

  return refs.join("+");
}

function buildCompactWorksheetModel(groupDive: GroupDive) {
  const worksheet: WorksheetModel = {
    cells: new Map(),
    merges: [],
    maxRow: 1,
  };

  const headerCells: [string, string][] = [
    ["A", "품명"],
    ["B", "전체인원"],
    ["C", "FOC"],
    ["D", "횟수"],
    ["E", "단가(원)"],
    ["F", "공급가액"],
    ["G", "포인트"],
  ];

  headerCells.forEach(([column, value]) => {
    setCell(worksheet, column, 1, {
      value,
      style: 5,
    });
  });

  let row = 2;
  const tripsByDate = groupDive.trips
    .filter(isBillableTrip)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return (a.actualDepartureTime || a.preferredTime || "")
        .localeCompare(
          b.actualDepartureTime || b.preferredTime || "",
        );
    })
    .reduce<Map<string, GroupDiveTrip[]>>(
      (map, trip) => {
        const trips = map.get(trip.date) ?? [];
        trips.push(trip);
        map.set(trip.date, trips);
        return map;
      },
      new Map(),
    );

  for (const [date, trips] of tripsByDate) {
    merge(worksheet, `A${row}:G${row}`);
    setCell(worksheet, "A", row, {
      value: formatDate(date),
      style: 6,
    });
    row += 1;

    trips.forEach((trip) => {
      const people = getTripBoardedCount(trip);
      const focCount = Math.min(getTripFocCount(trip), people);
      const unitPrice = getTripUnitPrice(
        trip,
        groupDive.defaultDiveUnitPrice,
      );

      setCell(worksheet, "A", row, {
        value: getTripName(trip),
        style: 7,
      });
      setCell(worksheet, "B", row, {
        value: people,
        style: 8,
      });
      setCell(worksheet, "C", row, {
        value: focCount,
        style: 8,
      });
      setCell(worksheet, "D", row, {
        value: 1,
        style: 8,
      });
      setCell(worksheet, "E", row, {
        value: unitPrice,
        style: 9,
      });
      setCell(worksheet, "F", row, {
        formula: `(B${row}-C${row})*D${row}*E${row}`,
        style: 9,
      });
      setCell(worksheet, "G", row, {
        value:
          trip.actualPointName ||
          trip.plannedPointName ||
          "",
        style: 7,
      });
      row += 1;
    });
  }

  if (groupDive.settlement.additionalItems.length > 0) {
    merge(worksheet, `A${row}:G${row}`);
    setCell(worksheet, "A", row, {
      value: "추가조정",
      style: 10,
    });
    row += 1;

    groupDive.settlement.additionalItems.forEach((item) => {
      setCell(worksheet, "A", row, {
        value: `${formatDate(item.date)} ${item.title}`,
        style: 7,
      });
      setCell(worksheet, "B", row, {
        value: 1,
        style: 8,
      });
      setCell(worksheet, "C", row, {
        value: 0,
        style: 8,
      });
      setCell(worksheet, "D", row, {
        value: 1,
        style: 8,
      });
      setCell(worksheet, "E", row, {
        value: item.amount,
        style: 9,
      });
      setCell(worksheet, "F", row, {
        formula: `E${row}`,
        style: 9,
      });
      setCell(worksheet, "G", row, {
        value: "추가비용",
        style: 7,
      });
      row += 1;
    });
  }

  worksheet.maxRow = Math.max(row - 1, 1);

  return worksheet;
}

function buildWorksheetModel(groupDive: GroupDive) {
  return buildCompactWorksheetModel(groupDive);

  const worksheet: WorksheetModel = {
    cells: new Map(),
    merges: [],
    maxRow: 42,
  };

  const merges = [
    "B2:AP2",
    "B3:AP3",
    "B4:E4",
    "F4:J4",
    "P4:S4",
    "T4:AB4",
    "AD4:AF4",
    "AG4:AK4",
    "B5:B10",
    "C5:E5",
    "F5:P5",
    "X5:Z5",
    "AA5:AF5",
    "AK5:AP7",
    "C6:E6",
    "F6:P6",
    "X6:Z6",
    "AA6:AF6",
    "C7:E7",
    "F7:P7",
    "X7:Z7",
    "AA7:AF7",
    "C8:E8",
    "F8:J8",
    "K8:P8",
    "X8:Z8",
    "AA8:AP8",
    "C9:E9",
    "F9:P9",
    "X9:Z9",
    "AA9:AF9",
    "C10:E10",
    "F10:J10",
    "K10:P10",
    "X10:Z10",
    "AA10:AF10",
    "B11:AP11",
    "B12:P12",
    "Q12:T12",
    "U12:X12",
    "Y12:AA12",
    "AB12:AF12",
    "AG12:AK12",
    "AL12:AP12",
  ];

  merges.forEach((range) => merge(worksheet, range));

  setCell(worksheet, "B", 2, {
    value: "내 역 서",
    style: 1,
  });
  setCell(worksheet, "B", 3, {
    value:
      "담당자: 송지선     이메일: songjs147@naver.com     연락처: 010-7334-1479",
    style: 2,
  });

  setCell(worksheet, "B", 4, {
    value: "체크인",
    style: 3,
  });
  setCell(worksheet, "F", 4, {
    value: formatDate(groupDive.startDate),
    style: 4,
  });
  setCell(worksheet, "P", 4, {
    value: "다이빙",
    style: 3,
  });
  setCell(worksheet, "T", 4, {
    value: formatPeriod(
      groupDive.startDate,
      groupDive.endDate,
    ),
    style: 4,
  });
  setCell(worksheet, "AD", 4, {
    value: "체크아웃",
    style: 3,
  });
  setCell(worksheet, "AG", 4, {
    value: formatDate(addDays(groupDive.endDate, 1)),
    style: 4,
  });

  setCell(worksheet, "B", 5, {
    value: "공급받는자",
    style: 3,
  });
  setCell(worksheet, "C", 5, {
    value: "등록번호",
    style: 3,
  });
  setCell(worksheet, "X", 5, {
    value: "공급자",
    style: 3,
  });
  setCell(worksheet, "AA", 5, {
    value: "804-24-02099",
    style: 4,
  });
  setCell(worksheet, "AK", 5, {
    value: "(인)",
    style: 2,
  });

  setCell(worksheet, "C", 6, {
    value: "성함",
    style: 3,
  });
  setCell(worksheet, "F", 6, {
    value: groupDive.representativeName,
    style: 4,
  });
  setCell(worksheet, "X", 6, {
    value: "대표자",
    style: 3,
  });
  setCell(worksheet, "AA", 6, {
    value: "송지선",
    style: 4,
  });

  setCell(worksheet, "C", 7, {
    value: "단체",
    style: 3,
  });
  setCell(worksheet, "F", 7, {
    value: groupDive.groupName,
    style: 4,
  });
  setCell(worksheet, "X", 7, {
    value: "회사명",
    style: 3,
  });
  setCell(worksheet, "AA", 7, {
    value: "성산스쿠버",
    style: 4,
  });

  setCell(worksheet, "C", 8, {
    value: "전화번호",
    style: 3,
  });
  setCell(worksheet, "F", 8, {
    value: groupDive.representativePhone,
    style: 4,
  });
  setCell(worksheet, "K", 8, {
    value: "이메일",
    style: 3,
  });
  setCell(worksheet, "X", 8, {
    value: "소재지",
    style: 3,
  });
  setCell(worksheet, "AA", 8, {
    value:
      "제주특별자치도 서귀포시 성산읍 일출로 258-5",
    style: 4,
  });

  setCell(worksheet, "C", 9, {
    value: "소재지",
    style: 3,
  });
  setCell(worksheet, "X", 9, {
    value: "업종",
    style: 3,
  });
  setCell(worksheet, "AA", 9, {
    value: "서비스업",
    style: 4,
  });

  setCell(worksheet, "C", 10, {
    value: "업종",
    style: 3,
  });
  setCell(worksheet, "K", 10, {
    value: "업태",
    style: 3,
  });
  setCell(worksheet, "X", 10, {
    value: "업태",
    style: 3,
  });
  setCell(worksheet, "AA", 10, {
    value: "스쿠버다이빙",
    style: 4,
  });

  setCell(worksheet, "B", 11, {
    value: "아래와 같이 명세합니다",
    style: 2,
  });

  const headerCells: [string, string][] = [
    ["B", "품명"],
    ["Q", "전체인원"],
    ["U", "FOC"],
    ["Y", "횟수"],
    ["AB", "단가(원)"],
    ["AG", "공급가액"],
    ["AL", "포인트"],
  ];

  headerCells.forEach(([column, value]) =>
    setCell(worksheet, column, 12, {
      value,
      style: 5,
    }),
  );

  let row = 13;
  const supplyRefs: string[] = [];
  const diveRefs: string[] = [];
  const additionalRefs: string[] = [];

  const tripsByDate = groupDive.trips
    .filter(isBillableTrip)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return (a.actualDepartureTime || a.preferredTime || "")
        .localeCompare(
          b.actualDepartureTime || b.preferredTime || "",
        );
    })
    .reduce<Map<string, GroupDiveTrip[]>>(
      (map, trip) => {
        const trips = map.get(trip.date) ?? [];
        trips.push(trip);
        map.set(trip.date, trips);
        return map;
      },
      new Map(),
    );

  for (const [date, trips] of tripsByDate) {
    merge(worksheet, `B${row}:AP${row}`);
    setCell(worksheet, "B", row, {
      value: formatDate(date),
      style: 6,
    });
    row += 1;

    trips.forEach((trip) => {
      const people = getTripBoardedCount(trip);
      const focCount = getTripFocCount(trip);
      const unitPrice = getTripUnitPrice(
        trip,
        groupDive.defaultDiveUnitPrice,
      );
      const supplyRef = `AG${row}`;

      [
        `B${row}:P${row}`,
        `Q${row}:T${row}`,
        `U${row}:X${row}`,
        `Y${row}:AA${row}`,
        `AB${row}:AF${row}`,
        `AG${row}:AK${row}`,
        `AL${row}:AP${row}`,
      ].forEach((range) => merge(worksheet, range));

      setCell(worksheet, "B", row, {
        value: getTripName(trip),
        style: 7,
      });
      setCell(worksheet, "Q", row, {
        value: people,
        style: 8,
      });
      setCell(worksheet, "U", row, {
        value: Math.min(focCount, people),
        style: 8,
      });
      setCell(worksheet, "Y", row, {
        value: 1,
        style: 8,
      });
      setCell(worksheet, "AB", row, {
        value: unitPrice,
        style: 9,
      });
      setCell(worksheet, "AG", row, {
        formula: `(Q${row}-U${row})*Y${row}*AB${row}`,
        style: 9,
      });
      setCell(worksheet, "AL", row, {
        value:
          trip.actualPointName ||
          trip.plannedPointName ||
          "",
        style: 7,
      });

      supplyRefs.push(supplyRef);
      diveRefs.push(supplyRef);
      row += 1;
    });
  }

  if (groupDive.settlement.additionalItems.length > 0) {
    merge(worksheet, `B${row}:AP${row}`);
    setCell(worksheet, "B", row, {
      value: "추가조정",
      style: 10,
    });
    row += 1;

    groupDive.settlement.additionalItems.forEach((item) => {
      const supplyRef = `AG${row}`;

      [
        `B${row}:P${row}`,
        `Q${row}:T${row}`,
        `U${row}:X${row}`,
        `Y${row}:AA${row}`,
        `AB${row}:AF${row}`,
        `AG${row}:AK${row}`,
        `AL${row}:AP${row}`,
      ].forEach((range) => merge(worksheet, range));

      setCell(worksheet, "B", row, {
        value: `${formatDate(item.date)} ${item.title}`,
        style: 7,
      });
      setCell(worksheet, "Q", row, {
        value: 1,
        style: 8,
      });
      setCell(worksheet, "U", row, {
        value: 0,
        style: 8,
      });
      setCell(worksheet, "Y", row, {
        value: 1,
        style: 8,
      });
      setCell(worksheet, "AB", row, {
        value: item.amount,
        style: 9,
      });
      setCell(worksheet, "AG", row, {
        formula: `AB${row}`,
        style: 9,
      });
      setCell(worksheet, "AL", row, {
        value: "추가비용",
        style: 7,
      });

      supplyRefs.push(supplyRef);
      additionalRefs.push(supplyRef);
      row += 1;
    });
  }

  const memoRow = row;
  [
    `B${memoRow}:E${memoRow + 3}`,
    `F${memoRow}:P${memoRow + 3}`,
    `Y${memoRow}:AF${memoRow}`,
    `AG${memoRow}:AK${memoRow}`,
    `Y${memoRow + 1}:AF${memoRow + 1}`,
    `AG${memoRow + 1}:AK${memoRow + 1}`,
    `Y${memoRow + 2}:AF${memoRow + 2}`,
    `AG${memoRow + 2}:AK${memoRow + 2}`,
    `Y${memoRow + 3}:AF${memoRow + 3}`,
    `AG${memoRow + 3}:AK${memoRow + 3}`,
    `B${memoRow + 4}:E${memoRow + 4}`,
    `F${memoRow + 4}:P${memoRow + 4}`,
    `Y${memoRow + 4}:AF${memoRow + 4}`,
    `AG${memoRow + 4}:AK${memoRow + 4}`,
    `Y${memoRow + 5}:AF${memoRow + 5}`,
    `AG${memoRow + 5}:AK${memoRow + 5}`,
  ].forEach((range) => merge(worksheet, range));

  setCell(worksheet, "B", memoRow, {
    value: "비고",
    style: 3,
  });
  setCell(worksheet, "F", memoRow, {
    value:
      groupDive.settlement.memo ||
      "언제나 찾아 주셔서 감사합니다.\n내용 확인 후 수정 또는 조정이 필요한 부분이 있으시면 말씀 부탁드립니다.",
    style: 11,
  });

  setCell(worksheet, "Y", memoRow, {
    value: "소계",
    style: 3,
  });
  setCell(worksheet, "AG", memoRow, {
    formula: sumFormula(supplyRefs),
    style: 9,
  });

  setCell(worksheet, "Y", memoRow + 1, {
    value: "다이빙",
    style: 3,
  });
  setCell(worksheet, "AG", memoRow + 1, {
    formula: sumFormula(diveRefs),
    style: 9,
  });

  setCell(worksheet, "Y", memoRow + 2, {
    value: "추가비용",
    style: 3,
  });
  setCell(worksheet, "AG", memoRow + 2, {
    formula: sumFormula(additionalRefs),
    style: 9,
  });

  setCell(worksheet, "Y", memoRow + 3, {
    value: "할인",
    style: 3,
  });
  setCell(worksheet, "AG", memoRow + 3, {
    value: groupDive.settlement.discountAmount,
    style: 9,
  });

  setCell(worksheet, "B", memoRow + 4, {
    value: "계좌번호",
    style: 3,
  });
  setCell(worksheet, "F", memoRow + 4, {
    value: "카카오뱅크 3333-06-7533614 송지선",
    style: 4,
  });
  setCell(worksheet, "Y", memoRow + 4, {
    value: "입금액",
    style: 3,
  });
  setCell(worksheet, "AG", memoRow + 4, {
    value: groupDive.settlement.paidAmount,
    style: 9,
  });

  setCell(worksheet, "Y", memoRow + 5, {
    value: "잔액",
    style: 3,
  });
  setCell(worksheet, "AG", memoRow + 5, {
    formula: `MAX(${cellRef("AG", memoRow)}-${cellRef(
      "AG",
      memoRow + 3,
    )}-${cellRef("AG", memoRow + 4)},0)`,
    style: 9,
  });

  worksheet.maxRow = memoRow + 5;

  return worksheet;
}

function renderCell(ref: string, cell: CellValue) {
  const style = typeof cell.style === "number" ? cell.style : 0;

  if (cell.formula) {
    return `<c r="${ref}" s="${style}"><f>${escapeXml(
      cell.formula,
    )}</f></c>`;
  }

  if (typeof cell.value === "number") {
    return `<c r="${ref}" s="${style}"><v>${cell.value}</v></c>`;
  }

  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    String(cell.value ?? ""),
  )}</t></is></c>`;
}

function renderSheet(worksheet: WorksheetModel) {
  const rows = new Map<number, [string, CellValue][]>();

  [...worksheet.cells.entries()].forEach(([ref, cell]) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);

    if (!match) {
      return;
    }

    const rowNumber = Number(match[2]);
    const row = rows.get(rowNumber) ?? [];
    row.push([ref, cell]);
    rows.set(rowNumber, row);
  });

  const rowXml = [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rowNumber, cells]) => {
      const cellsXml = cells
        .sort(
          ([a], [b]) =>
            columnToNumber(a.replace(/\d+$/, "")) -
            columnToNumber(b.replace(/\d+$/, "")),
        )
        .map(([ref, cell]) => renderCell(ref, cell))
        .join("");

      return `<row r="${rowNumber}" ht="22" customHeight="1">${cellsXml}</row>`;
    })
    .join("");

  const mergeXml =
    worksheet.merges.length > 0
      ? `<mergeCells count="${worksheet.merges.length}">${worksheet.merges
          .map((range) => `<mergeCell ref="${range}"/>`)
          .join("")}</mergeCells>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${LAST_COLUMN}${worksheet.maxRow}"/>
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>
    <col min="1" max="1" width="28" customWidth="1"/>
    <col min="2" max="4" width="10" customWidth="1"/>
    <col min="5" max="6" width="12" customWidth="1"/>
    <col min="7" max="7" width="14" customWidth="1"/>
  </cols>
  <sheetData>${rowXml}</sheetData>
  ${mergeXml}
  <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
</worksheet>`;
}

function renderStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="10"/><name val="맑은 고딕"/></font>
    <font><b/><sz val="20"/><name val="맑은 고딕"/></font>
    <font><b/><sz val="10"/><name val="맑은 고딕"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="맑은 고딕"/></font>
    <font><sz val="9"/><name val="맑은 고딕"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0F2FE"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="thin"><color rgb="FF94A3B8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function zipWorkbook(files: Record<string, string>) {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = new ZipArchive({
      zlib: {
        level: 9,
      },
    });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    archive.on("error", reject);
    archive.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    Object.entries(files).forEach(([path, content]) => {
      archive.append(content, {
        name: path,
      });
    });

    void archive.finalize();
  });
}

export function getGroupDiveStatementFileName(
  groupDive: GroupDive,
) {
  const date = groupDive.startDate.replaceAll("-", "");
  const name = sanitizeFileName(
    groupDive.representativeName ||
      groupDive.groupName ||
      "group-dive",
  );

  return `${name}_${date}.xlsx`;
}

export async function createGroupDiveStatementWorkbook(
  groupDive: GroupDive,
) {
  const worksheet = buildWorksheetModel(groupDive);

  return zipWorkbook({
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="견적서" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": renderStyles(),
    "xl/worksheets/sheet1.xml": renderSheet(worksheet),
  });
}
