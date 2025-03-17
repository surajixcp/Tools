const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

// Serve HTML, CSS, and JS
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pdf-merger.html'));
});

// Merge PDFs endpoint
app.post('/merge', upload.array('pdfs'), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdfBytes = fs.readFileSync(file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
    fs.unlinkSync(file.path); // Clean up uploaded files
  }

  const mergedPdfBytes = await mergedPdf.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
  res.send(mergedPdfBytes);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});