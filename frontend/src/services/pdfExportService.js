import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Universal PDF Export Service for Nirikshak AI
 * Captures live rendered DOM reports, SVG charts, data tables, and KPI cards,
 * with multi-page pagination, official MoSPI headers, and footer timestamps.
 */

export async function exportElementToPdf(elementOrId, options = {}) {
  const {
    filename = 'Nirikshak_AI_Report.pdf',
    title = 'NIRIKSHAK AI OFFICIAL REPORT',
    subtitle = 'Ministry of Statistics and Programme Implementation (MoSPI) • Government of India',
    orientation = 'portrait', // 'portrait' or 'landscape'
    hideSelectors = ['.no-print', 'button', 'input', 'select'],
    marginMm = 10,
  } = options;

  const targetElement = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId) || document.querySelector(elementOrId)
    : elementOrId;

  if (!targetElement) {
    console.error(`exportElementToPdf: Target element not found:`, elementOrId);
    throw new Error('Target element for PDF export was not found.');
  }

  // Visual feedback: show cursor wait
  const prevCursor = document.body.style.cursor;
  document.body.style.cursor = 'wait';

  // Temporarily hide elements matching hideSelectors
  const hiddenElements = [];
  hideSelectors.forEach(selector => {
    targetElement.querySelectorAll(selector).forEach(el => {
      // Don't hide elements with .keep-in-print
      if (!el.classList.contains('keep-in-print')) {
        const origDisplay = el.style.display;
        el.style.display = 'none';
        hiddenElements.push({ el, origDisplay });
      }
    });
  });

  try {
    // 1. High-resolution canvas capture using html2canvas
    const canvas = await html2canvas(targetElement, {
      scale: 2, // 2x resolution for crisp typography, borders and graphs
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAF8F3', // Nirikshak theme cream background
      logging: false,
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight,
    });

    // 2. Initialize jsPDF Document (A4 standard: 210mm x 297mm)
    const isLandscape = orientation === 'landscape';
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

    const contentWidth = pageWidth - (marginMm * 2);
    const headerHeight = 18; // space for header
    const footerHeight = 12; // space for footer
    const printableHeight = pageHeight - (marginMm * 2) - headerHeight - footerHeight;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Helper to draw official header and footer
    const drawHeaderFooter = (currentPage, totalPages) => {
      // Header Banner
      pdf.setFillColor(10, 36, 88); // #0A2458 Deep Navy
      pdf.rect(marginMm, marginMm, contentWidth, 1.2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(10, 36, 88);
      pdf.text(title.toUpperCase(), marginMm, marginMm + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, marginMm, marginMm + 10);

      // Date Stamp in top right
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      pdf.text(`Generated: ${dateStr}`, pageWidth - marginMm, marginMm + 6, { align: 'right' });
      pdf.text('STATUS: OFFICIAL AUDIT', pageWidth - marginMm, marginMm + 10, { align: 'right' });

      // Footer Banner
      const footerY = pageHeight - marginMm - 4;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(marginMm, footerY - 2, pageWidth - marginMm, footerY - 2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text('NIRIKSHAK AI — Integrated MPLADS Intelligence & Project Integrity Platform', marginMm, footerY + 2);
      pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - marginMm, footerY + 2, { align: 'right' });
    };

    // Calculate total pages needed
    const totalPages = Math.max(1, Math.ceil(imgHeight / printableHeight));

    // Page 1
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const startY = marginMm + headerHeight;

    if (imgHeight <= printableHeight) {
      // Single Page Report
      pdf.addImage(imgData, 'JPEG', marginMm, startY, imgWidth, imgHeight);
      drawHeaderFooter(1, 1);
    } else {
      // Multi-Page Slicing using canvas coordinate clipping
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');

      const pxScale = canvas.width / imgWidth;
      const sliceHeightPx = printableHeight * pxScale;

      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) {
          pdf.addPage();
        }

        const sourceY = p * sliceHeightPx;
        const currentSliceHeight = Math.min(sliceHeightPx, canvas.height - sourceY);

        pageCanvas.height = currentSliceHeight;
        pageCtx.fillStyle = '#FAF8F3';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, currentSliceHeight,
          0, 0, canvas.width, currentSliceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const renderHeightMm = (currentSliceHeight * imgWidth) / canvas.width;

        pdf.addImage(pageImgData, 'JPEG', marginMm, startY, imgWidth, renderHeightMm);
        drawHeaderFooter(p + 1, totalPages);
      }
    }

    // 4. Trigger download
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return { success: true, filename };

  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  } finally {
    // Restore hidden elements
    hiddenElements.forEach(({ el, origDisplay }) => {
      el.style.display = origDisplay;
    });
    document.body.style.cursor = prevCursor;
  }
}

/**
 * Generates an official tabular audit report PDF from raw data objects
 */
export async function exportStructuredAuditPdf(config = {}) {
  const {
    filename = 'MPLADS_Audit_Report.pdf',
    title = 'MPLADS PROJECT PERFORMANCE AUDIT REPORT',
    subtitle = 'MoSPI Nirikshak AI Intelligence System',
    metaItems = [],
    kpis = [],
    tables = [],
    summaryText = '',
  } = config;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  let curY = margin;

  // Header Banner
  pdf.setFillColor(10, 36, 88); // #0A2458
  pdf.rect(margin, curY, contentWidth, 1.5, 'F');
  curY += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(10, 36, 88);
  pdf.text(title, margin, curY);
  curY += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text(subtitle, margin, curY);

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  pdf.text(`Date: ${dateStr}`, pageWidth - margin, curY, { align: 'right' });
  curY += 7;

  // Meta Section Box
  if (metaItems.length > 0) {
    pdf.setFillColor(245, 243, 237); // #FAF8F3
    pdf.setDrawColor(29, 30, 34);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, curY, contentWidth, 16, 1.5, 1.5, 'FD');

    const colW = contentWidth / metaItems.length;
    metaItems.forEach((m, idx) => {
      const x = margin + (idx * colW) + 3;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text(m.label.toUpperCase(), x, curY + 5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(29, 30, 34);
      pdf.text(String(m.value || 'N/A'), x, curY + 11);
    });
    curY += 21;
  }

  // KPI Grid
  if (kpis.length > 0) {
    const kpiW = (contentWidth - ((kpis.length - 1) * 3)) / kpis.length;
    kpis.forEach((kpi, idx) => {
      const x = margin + (idx * (kpiW + 3));
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(29, 30, 34);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, curY, kpiW, 16, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text(kpi.label.toUpperCase(), x + 3, curY + 5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(kpi.color === 'red' ? 217 : (kpi.color === 'green' ? 30 : 10), kpi.color === 'red' ? 83 : (kpi.color === 'green' ? 126 : 36), kpi.color === 'red' ? 79 : (kpi.color === 'green' ? 52 : 88));
      pdf.text(String(kpi.value), x + 3, curY + 12);
    });
    curY += 21;
  }

  // Summary Text
  if (summaryText) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(29, 30, 34);
    pdf.text('EXECUTIVE SUMMARY & FINDINGS', margin, curY);
    curY += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(60, 60, 60);
    const splitText = pdf.splitTextToSize(summaryText, contentWidth - 4);
    pdf.text(splitText, margin + 2, curY);
    curY += (splitText.length * 3.8) + 6;
  }

  // Tables
  tables.forEach(tbl => {
    if (curY > pageHeight - 40) {
      pdf.addPage();
      curY = margin + 10;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(29, 30, 34);
    pdf.text(tbl.title, margin, curY);
    curY += 4;

    // Table Header
    const rowH = 6;
    pdf.setFillColor(243, 239, 230);
    pdf.rect(margin, curY, contentWidth, rowH, 'F');
    pdf.setDrawColor(29, 30, 34);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, curY, contentWidth, rowH, 'S');

    const colWidths = tbl.colWidths || tbl.headers.map(() => contentWidth / tbl.headers.length);
    let curX = margin;

    tbl.headers.forEach((h, i) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(29, 30, 34);
      pdf.text(h, curX + 2, curY + 4.2);
      curX += colWidths[i];
    });
    curY += rowH;

    // Table Rows
    tbl.rows.forEach((row, rIdx) => {
      if (curY > pageHeight - 20) {
        pdf.addPage();
        curY = margin + 10;
      }

      pdf.setFillColor(rIdx % 2 === 0 ? 255 : 250, rIdx % 2 === 0 ? 255 : 248, rIdx % 2 === 0 ? 255 : 243);
      pdf.rect(margin, curY, contentWidth, rowH, 'F');
      pdf.rect(margin, curY, contentWidth, rowH, 'S');

      curX = margin;
      row.forEach((cell, cIdx) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(40, 40, 40);
        pdf.text(String(cell || '').substring(0, 40), curX + 2, curY + 4.2);
        curX += colWidths[cIdx];
      });
      curY += rowH;
    });

    curY += 6;
  });

  // Footer
  const footerY = pageHeight - margin;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Nirikshak AI • Official Audit Export • Ministry of Statistics & Programme Implementation', margin, footerY + 2);
  pdf.text('Page 1 of 1', pageWidth - margin, footerY + 2, { align: 'right' });

  pdf.save(filename);
  return { success: true, filename };
}
