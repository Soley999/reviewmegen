import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph } from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "..", "sample-files");

const sampleText = [
  "Cellular Respiration Overview",
  "",
  "Cellular respiration is the process cells use to convert glucose into usable energy in the form of ATP.",
  "It occurs in three main stages: glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation.",
  "Glycolysis happens in the cytoplasm and splits one glucose molecule into two molecules of pyruvate, producing a small amount of ATP and NADH.",
  "The citric acid cycle takes place in the mitochondria and generates additional NADH and FADH2.",
  "During oxidative phosphorylation, electrons from NADH and FADH2 move through the electron transport chain to produce a large amount of ATP.",
  "Oxygen acts as the final electron acceptor and combines with hydrogen ions to form water.",
  "Cellular respiration is essential for providing energy for growth, repair, and daily cellular activities."
].join("\n");

fs.mkdirSync(outputDir, { recursive: true });

const pdfPath = path.join(outputDir, "sample.pdf");
const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream(pdfPath));
doc.fontSize(18).text("Cellular Respiration Overview", { underline: true });
doc.moveDown();
doc.fontSize(12).text(sampleText.replace(/\n/g, "\n\n"));
doc.end();

const docxPath = path.join(outputDir, "sample.docx");
const docx = new Document({
  sections: [
    {
      properties: {},
      children: sampleText.split("\n").map((line) => new Paragraph(line))
    }
  ]
});

const buffer = await Packer.toBuffer(docx);
fs.writeFileSync(docxPath, buffer);

console.log("Sample files generated:", pdfPath, docxPath);
