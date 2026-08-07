import ExcelJS from "exceljs";
import type { RomaneioRecord } from '../types/romaneio';

const CURRENCY_FMT =
  '_-"R$"\\ * #,##0.00_-;\\-"R$"\\ * #,##0.00_-;_-"R$"\\ * "-"??_-;_-@_-';

const LABEL_FONT = { name: "Calibri", size: 12, bold: true };
const VALUE_FONT = { name: "Calibri", size: 12, bold: false };
const HEADER_FONT = { name: "Aptos Narrow", size: 12, bold: true };

const MED = "medium";

export async function exportToExcel(
  records: RomaneioRecord[],
  filename = "romaneios.xlsx",
  cabecalho: any = {}
) {
  const { propriedade = "", cgf = "", pivo = "", ha = "", inicio = "", fim = "" } =
    cabecalho;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("ORKESTRA");

  // ---- Larguras / alturas ----
  sheet.getColumn("A").width = 3;
  sheet.getColumn("B").width = 13.7;
  sheet.getColumn("C").width = 10.1;
  sheet.getColumn("D").width = 31.2;
  sheet.getColumn("E").width = 11.9;
  sheet.getColumn("F").width = 9.2;
  sheet.getColumn("G").width = 13.9;

  sheet.getRow(1).height = 16.2;
  sheet.getRow(4).height = 16.2;
  sheet.getRow(5).height = 16.2;
  sheet.getRow(6).height = 31.8;

  // ---- Bloco de cabeçalho (linhas 2–4) com moldura B2:F4 ----
  sheet.getCell("B2").value = "PROPRIEDADE:";
  sheet.getCell("B2").font = LABEL_FONT;
  sheet.getCell("F2").value = "CGF";
  sheet.getCell("F2").font = LABEL_FONT;
  sheet.getCell("G2").value = cgf;
  sheet.getCell("G2").font = VALUE_FONT;

  sheet.getCell("B3").value = propriedade;
  sheet.getCell("B3").font = VALUE_FONT;
  sheet.mergeCells("D2:E2");
  sheet.getCell("D2").value = pivo;
  sheet.getCell("D2").font = VALUE_FONT;
  sheet.getCell("D3").value = "PIVO:";
  sheet.getCell("D3").font = LABEL_FONT;
  sheet.getCell("F3").value = "INÍCIO";
  sheet.getCell("F3").font = LABEL_FONT;
  sheet.getCell("G3").value = inicio;
  sheet.getCell("G3").font = VALUE_FONT;

  sheet.mergeCells("B4:C4");
  sheet.getCell("B4").value = ha;
  sheet.getCell("B4").font = VALUE_FONT;
  sheet.getCell("D4").value = "ha:";
  sheet.getCell("D4").font = LABEL_FONT;
  sheet.getCell("F4").value = "FIM";
  sheet.getCell("F4").font = LABEL_FONT;
  sheet.getCell("G4").value = fim;
  sheet.getCell("G4").font = VALUE_FONT;

  // moldura da caixa B2:F4
  ["B", "C", "D", "E", "F"].forEach((col) => {
    sheet.getCell(`${col}2`).border = {
      ...sheet.getCell(`${col}2`).border,
      top: { style: MED as ExcelJS.BorderStyle },
    };
    sheet.getCell(`${col}4`).border = {
      ...sheet.getCell(`${col}4`).border,
      bottom: { style: MED as ExcelJS.BorderStyle },
    };
  });
  ["2", "3", "4"].forEach((r) => {
    sheet.getCell(`B${r}`).border = {
      ...sheet.getCell(`B${r}`).border,
      left: { style: MED as ExcelJS.BorderStyle },
    };
    sheet.getCell(`F${r}`).border = {
      ...sheet.getCell(`F${r}`).border,
      right: { style: MED as ExcelJS.BorderStyle },
    };
  });

  // ---- Cabeçalho da tabela (linha 6) ----
  const headerLabels = ["DATA", "ROMANEIO", "TIPO", "QUANTIDADE", "VALOR", "VALOR TOTAL", "PAGAMENTO"];
  const headerCols = ["B", "C", "D", "E", "F", "G", "H"];
  headerCols.forEach((col, idx) => {
    const cell = sheet.getCell(`${col}6`);
    cell.value = headerLabels[idx];
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: { style: MED as ExcelJS.BorderStyle }, bottom: { style: MED as ExcelJS.BorderStyle } };
  });
  sheet.getCell("B6").border = {
    ...sheet.getCell("B6").border,
    left: { style: MED as ExcelJS.BorderStyle },
  };

  // ---- Linhas de dados (a partir da linha 7), agrupadas por romaneio ----
  let rowIdx = 7;

  const ordered = records
    .filter((r) => r.status === "success")
    .sort((a, b) => {
      const na = parseInt(a.romaneioNumero || "0", 10);
      const nb = parseInt(b.romaneioNumero || "0", 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return (a.romaneioNumero || "").localeCompare(b.romaneioNumero || "");
    });

  for (const record of ordered) {
    const itens = record.itens.length
      ? record.itens
      : [{ mercadoria: "Sem itens", quantidade: 0, valorUnitario: 0, valorTotal: 0 }];

    const groupStartRow = rowIdx;

    for (const item of itens) {
      const quantidade = typeof item.quantidade === "number" ? item.quantidade : 0;
      const valorUnitario =
        typeof item.valorUnitario === "number" ? item.valorUnitario : 0;

      sheet.getRow(rowIdx).height = 16.2;

      sheet.getCell(`B${rowIdx}`).value = record.data || "";
      sheet.getCell(`C${rowIdx}`).value = record.romaneioNumero || "";
      sheet.getCell(`D${rowIdx}`).value = item.mercadoria || "";
      sheet.getCell(`E${rowIdx}`).value = quantidade;
      sheet.getCell(`F${rowIdx}`).value = valorUnitario;
      sheet.getCell(`G${rowIdx}`).value = { formula: `E${rowIdx}*F${rowIdx}` };
      sheet.getCell(`H${rowIdx}`).value = record.pagamento || "";

      ["B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
        sheet.getCell(`${col}${rowIdx}`).font = VALUE_FONT;
      });
      sheet.getCell(`B${rowIdx}`).border = { left: { style: MED as ExcelJS.BorderStyle } };
      sheet.getCell(`F${rowIdx}`).numFmt = CURRENCY_FMT;
      sheet.getCell(`G${rowIdx}`).numFmt = CURRENCY_FMT;

      rowIdx++;
    }

    const groupEndRow = rowIdx - 1;
    // borda de grupo: topo na 1ª linha, base na última (igual ao modelo)
    ["B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
      const topCell = sheet.getCell(`${col}${groupStartRow}`);
      topCell.border = { ...topCell.border, top: { style: MED as ExcelJS.BorderStyle } };
      const botCell = sheet.getCell(`${col}${groupEndRow}`);
      botCell.border = { ...botCell.border, bottom: { style: MED as ExcelJS.BorderStyle } };
    });
  }

  // ---- Rodapé de totais foi removido a pedido do usuário ----

  // ---- Gera o arquivo e dispara o download ----
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
