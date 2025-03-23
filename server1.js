const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const excel = require('exceljs');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

app.post('/convert', upload.single('pdf'), async (req, res) => {
    const pdfPath = req.file.path;
    const pdfBytes = fs.readFileSync(pdfPath);

    try {
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');

        // Extract text from PDF and add to Excel (simplified)
        const pages = pdfDoc.getPages();
        pages.forEach((page, index) => {
            const text = page.getTextContent();
            worksheet.addRow([`Page ${index + 1}`, text.items.map(item => item.str).join(' ')]);
        });

        const excelPath = path.join(__dirname, `converted-${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(excelPath);

        res.download(excelPath, () => {
            fs.unlinkSync(pdfPath); // Delete uploaded PDF
            fs.unlinkSync(excelPath); // Delete generated Excel
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred during conversion.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});