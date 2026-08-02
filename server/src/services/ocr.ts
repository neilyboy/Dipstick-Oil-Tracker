import { prisma } from '../db';

export async function performOcr(receiptId: string, filePath: string): Promise<void> {
  try {
    // Use Tesseract.js for OCR
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });

    const rawText = result.data.text;
    if (!rawText || rawText.trim().length === 0) {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { ocrProcessed: true, ocrRawText: '(no text detected)' },
      });
      return;
    }

    // Parse extracted text for common receipt fields
    const parsed = parseReceiptText(rawText);

    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        ocrProcessed: true,
        ocrRawText: rawText.substring(0, 10000), // Limit stored text
        ocrMerchantName: parsed.merchant,
        ocrDate: parsed.date,
        ocrTotal: parsed.total,
        ocrTax: parsed.tax,
        ocrLineItems: parsed.lineItems,
      },
    });

    console.log(`OCR completed for receipt ${receiptId}`);
  } catch (error) {
    console.error(`OCR error for receipt ${receiptId}:`, error);
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { ocrProcessed: true, ocrRawText: '(OCR failed)' },
    });
  }
}

interface ParsedReceipt {
  merchant: string | null;
  date: Date | null;
  total: number | null;
  tax: number | null;
  lineItems: Array<{ name: string; quantity: number | null; price: number | null }>;
}

function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let merchant: string | null = null;
  let date: Date | null = null;
  let total: number | null = null;
  let tax: number | null = null;
  const lineItems: ParsedReceipt['lineItems'] = [];

  // Merchant is usually the first non-empty line
  if (lines.length > 0) {
    merchant = lines[0].replace(/[^a-zA-Z0-9\s&'.\-]/g, '').trim().substring(0, 100);
  }

  // Look for date patterns
  const datePatterns = [
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
  ];
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) {
          date = d;
          break;
        }
      }
    }
    if (date) break;
  }

  // Look for total
  const totalPatterns = [
    /total\s*:?\s*\$?(\d+[.,]\d{2})/i,
    /amount\s*due\s*:?\s*\$?(\d+[.,]\d{2})/i,
    /balance\s*due\s*:?\s*\$?(\d+[.,]\d{2})/i,
    /\$?\s*(\d+[.,]\d{2})\s*$/,
  ];
  for (const line of lines.reverse()) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        total = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }
    if (total) break;
  }

  // Look for tax
  const taxPatterns = [
    /tax\s*:?\s*\$?(\d+[.,]\d{2})/i,
    /hst\s*:?\s*\$?(\d+[.,]\d{2})/i,
    /gst\s*:?\s*\$?(\d+[.,]\d{2})/i,
    /vat\s*:?\s*\$?(\d+[.,]\d{2})/i,
  ];
  for (const line of lines) {
    for (const pattern of taxPatterns) {
      const match = line.match(pattern);
      if (match) {
        tax = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }
    if (tax) break;
  }

  // Look for line items (lines with quantity and price)
  const itemPattern = /(\d+)\s*x?\s*(.+?)\s*\$?(\d+[.,]\d{2})/i;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && match[2].length > 2) {
      lineItems.push({
        name: match[2].trim().substring(0, 100),
        quantity: parseInt(match[1]),
        price: parseFloat(match[3].replace(',', '.')),
      });
    }
  }

  return { merchant, date, total, tax, lineItems };
}
