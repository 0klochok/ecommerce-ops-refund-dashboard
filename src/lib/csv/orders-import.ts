export type CsvRecord = {
  recordNumber: number;
  values: string[];
};

export type CsvParseError = {
  message: string;
  rowNumber: number;
};

export type CsvParseResult = {
  errors: CsvParseError[];
  records: CsvRecord[];
};

export function parseCsvRecords(text: string): CsvParseResult {
  const records: CsvRecord[] = [];
  const errors: CsvParseError[] = [];
  let currentField = "";
  let currentRecord: string[] = [];
  let inQuotes = false;
  let recordNumber = 1;

  function pushField() {
    currentRecord.push(currentField);
    currentField = "";
  }

  function pushRecord() {
    pushField();
    records.push({
      recordNumber,
      values: currentRecord,
    });
    currentRecord = [];
    recordNumber += 1;
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        currentField += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      pushField();
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      pushRecord();
      continue;
    }

    currentField += character;
  }

  if (inQuotes) {
    errors.push({
      message: "CSV contains an unclosed quoted field.",
      rowNumber: recordNumber,
    });
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    pushRecord();
  }

  return {
    errors,
    records: records.filter((record, index) => {
      const isLastRecord = index === records.length - 1;
      const isBlank = record.values.every((value) => value.trim().length === 0);

      return !(isLastRecord && isBlank);
    }),
  };
}

