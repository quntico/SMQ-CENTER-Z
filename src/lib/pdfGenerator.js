import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper to fetch image and convert to base64
const toBase64 = async (url) => {
  try {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

const formatCurrency = (value, currency = 'USD') => {
  if (typeof value !== 'number' || isNaN(value)) return currency === 'USD' ? '$0.00' : '$0.00 MXN';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value);
};

const addClientHeader = async (doc, quotationData, margin) => {
  const pageWidth = doc.internal.pageSize.width;

  // Logo SMQ
  const logoUrl = '/smq-logo.png'; // Assumes file is in public folder
  try {
    const logoBase64 = await toBase64(logoUrl);
    if (logoBase64) {
      const logoWidth = 85; // Approx 3cm
      const logoHeight = 85; // Approx 3cm
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, 20, logoWidth, logoHeight);
    }
  } catch (e) {
    console.error("Could not add logo to PDF:", e);
  }

  let cursorY = 120; // Start text after logo

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const clientInfo = [
    { label: 'CLIENTE:', value: quotationData.client || 'N/A' },
    { label: 'EMPRESA:', value: quotationData.company || 'SMQ' },
    { label: 'PROYECTO:', value: quotationData.project || 'N/A' },
  ];

  let leftCursorY = cursorY;
  clientInfo.forEach(info => {
    doc.text(info.label, margin, leftCursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + 55, leftCursorY);
    doc.setFont('helvetica', 'bold');
    leftCursorY += 12;
  });

  const dateLabel = 'FECHA:';
  const dateText = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });
  const dateLabelWidth = doc.getStringUnitWidth(dateLabel) * doc.getFontSize() / doc.internal.scaleFactor;
  const dateTextWidth = doc.getStringUnitWidth(dateText) * doc.getFontSize() / doc.internal.scaleFactor;
  const dateBlockX = pageWidth - margin - dateTextWidth - dateLabelWidth - 5;

  doc.setFont('helvetica', 'bold');
  doc.text(dateLabel, dateBlockX, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(dateText, dateBlockX + dateLabelWidth + 5, cursorY);

  return leftCursorY;
};

const addFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  const text = "SMQ INTERNACIONAL - DIRECCIÓN DE VENTAS";
  doc.text(text, pageWidth / 2, pageHeight - 25, { align: 'center' });
};

export const generateCotizadorPDF = async (pdfData) => {
  const { quotationData, costConfig, calculatedCosts, subtotals } = pdfData;
  const { costoMaquina, totalOpcionales, utilidad_usd, comision_usd, comision_mxn, subtotalBeforeProfit } = subtotals;

  const doc = new jsPDF('p', 'pt', 'a4');
  const brandColor = '#0052CC';
  const textColor = [0, 0, 0];
  const headerTextColor = [255, 255, 255];
  const alternateRowColor = [245, 245, 245];
  const margin = 30;

  let cursorY = await addClientHeader(doc, quotationData, margin);
  cursorY += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text('RADIOGRAFÍA DE COTIZACIÓN', doc.internal.pageSize.width / 2, cursorY, { align: 'center' });
  cursorY += 20;

  const tableStyles = (specificMargin) => ({
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: textColor,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: brandColor,
      textColor: headerTextColor,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: alternateRowColor,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    margin: specificMargin,
  });

  const addSectionTitle = (title, y, x = margin) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandColor);
    doc.text(title, x, y);
    return y + 15;
  };

  cursorY = addSectionTitle('Costos Directos', cursorY);
  const costosBody = [
    ['Costo China (USD)', formatCurrency(costConfig.costo_china)],
    ['Incoterm', costConfig.incoterm],
    ['Costo Terrestre China (USD)', formatCurrency(costConfig.costo_terrestre_china)],
    ['Marítimo (USD)', formatCurrency(costConfig.maritimo)],
    ['Terrestre Nacional (USD)', formatCurrency(costConfig.terrestre_nacional)],
    ['Instalación (USD)', formatCurrency(costConfig.instalacion)],
    [{ content: 'Costo Máquina (Subtotal)', styles: { fillColor: alternateRowColor, fontStyle: 'bold' } }, { content: formatCurrency(costoMaquina), styles: { fillColor: alternateRowColor, fontStyle: 'bold' } }],
  ];
  doc.autoTable({ head: [['Concepto', 'Valor']], body: costosBody, startY: cursorY, ...tableStyles({ left: margin, right: margin }) });
  cursorY = doc.autoTable.previous.finalY + 15;

  if (costConfig.optionals && costConfig.optionals.length > 0) {
    cursorY = addSectionTitle('Opcionales', cursorY);
    const opcionalesBody = costConfig.optionals.map(opt => [opt.name, formatCurrency(Number(opt.cost) || 0)]);
    opcionalesBody.push([{ content: 'Total Opcionales', styles: { fillColor: alternateRowColor, fontStyle: 'bold' } }, { content: formatCurrency(totalOpcionales), styles: { fillColor: alternateRowColor, fontStyle: 'bold' } }]);
    doc.autoTable({ head: [['Descripción', 'Costo (USD)']], body: opcionalesBody, startY: cursorY, ...tableStyles({ left: margin, right: margin }) });
    cursorY = doc.autoTable.previous.finalY + 15;
  }

  const pageWidth = doc.internal.pageSize.width;
  const gap = 10;
  const leftColumnX = margin;
  const rightColumnX = pageWidth / 2 + gap / 2;
  const columnWidth = pageWidth / 2 - margin - gap / 2;

  const formatCalculationParam = (param, value_usd) => {
    if (param.type === 'percent') {
      return `${param.value.toFixed(2)}% (${formatCurrency(value_usd)})`;
    }
    return `${formatCurrency(param.value, param.type)} (${formatCurrency(value_usd)})`;
  };

  let paramsCursorY = addSectionTitle('Parámetros de Cálculo', cursorY, leftColumnX);
  const paramsBody = [
    ['Utilidad', formatCalculationParam(costConfig.utilidad, utilidad_usd)],
    ['Comisión', formatCalculationParam(costConfig.comision, comision_usd)],
    ['Impuestos de Importación', `${costConfig.impuestos_percent}%`],
    ['Tipo de Cambio (USD a MXN)', formatCurrency(costConfig.tipo_cambio, 'MXN')],
  ];
  doc.autoTable({
    head: [['Parámetro', 'Valor']],
    body: paramsBody,
    startY: paramsCursorY,
    ...tableStyles({ left: leftColumnX, right: pageWidth - leftColumnX - columnWidth })
  });
  const paramsFinalY = doc.autoTable.previous.finalY;

  let resumenCursorY = addSectionTitle('Resumen Financiero', cursorY, rightColumnX);
  const resumenBody = [
    ['Subtotal', formatCurrency(subtotalBeforeProfit)],
    ['Utilidad', formatCurrency(utilidad_usd)],
    ['Comisión', `${formatCurrency(comision_usd)} (${formatCurrency(comision_mxn, 'MXN')})`],
    ['Precio Venta (USD)', formatCurrency(calculatedCosts.precio_venta)],
    ['Precio Venta (MXN)', formatCurrency(calculatedCosts.precio_venta_mxn, 'MXN')],
    ['I.V.A. (16%)', formatCurrency(calculatedCosts.iva)],
    [{ content: 'TOTAL (USD)', styles: { fontStyle: 'bold', textColor: brandColor, fontSize: 9 } }, { content: formatCurrency(calculatedCosts.neto), styles: { fontStyle: 'bold', textColor: brandColor, fontSize: 9 } }],
    [{ content: 'TOTAL (MXN)', styles: { fontStyle: 'bold', textColor: brandColor, fontSize: 9 } }, { content: formatCurrency(calculatedCosts.neto_mxn, 'MXN'), styles: { fontStyle: 'bold', textColor: brandColor, fontSize: 9 } }],
    [{ content: 'Factor', styles: { fontStyle: 'bold', fontSize: 9 } }, { content: calculatedCosts.factor.toFixed(2), styles: { fontStyle: 'bold', fontSize: 9 } }],
  ];
  doc.autoTable({
    head: [['Concepto', 'Valor']],
    body: resumenBody,
    startY: resumenCursorY,
    ...tableStyles({ left: rightColumnX, right: margin })
  });
  const resumenFinalY = doc.autoTable.previous.finalY;

  cursorY = Math.max(paramsFinalY, resumenFinalY) + 20;

  addFooter(doc);
  doc.save(`Radiografia_Cotizacion_${quotationData.project.replace(/\s/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
};


export const generateFichasTecnicasPDF = async (fichas, quotationData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let cursorY = margin;

  const addFichaHeader = async () => {
    if (quotationData.logo) {
      const logoBase64 = await toBase64(quotationData.logo);
      if (logoBase64) {
        const logoWidth = 30;
        const logoHeight = 15;
        doc.addImage(logoBase64, 'PNG', pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
      }
    }
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`CLIENTE: ${quotationData.client || 'N/A'}`, margin, cursorY);
    cursorY += 5;
    doc.text(`EMPRESA: ${quotationData.company || 'N/A'}`, margin, cursorY);
    cursorY += 5;
    doc.text(`PROYECTO: ${quotationData.project || 'N/A'}`, margin, cursorY);
    cursorY += 5;
    const now = new Date();
    const formattedDate = format(now, "dd MMMM, yyyy 'a las' HH:mm", { locale: es });
    doc.text(`FECHA: ${formattedDate}`, margin, cursorY);
    cursorY += 15;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text('FICHAS TÉCNICAS', margin, cursorY);
    cursorY += 10;
  };

  await addFichaHeader();

  for (const ficha of fichas) {
    if (cursorY > pageHeight - 60) {
      doc.addPage();
      cursorY = margin;
      await addFichaHeader();
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 124, 240);
    doc.text(ficha.tabTitle, margin, cursorY);
    cursorY += 8;

    if (ficha.image) {
      const imageBase64 = await toBase64(ficha.image);
      if (imageBase64) {
        const imgProps = doc.getImageProperties(imageBase64);
        const imgWidth = 100;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        if (cursorY + imgHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
          await addFichaHeader();
        }
        doc.addImage(imageBase64, 'PNG', (pageWidth - imgWidth) / 2, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 10;
      }
    }

    const fichaTableStyles = {
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      startY: cursorY,
      margin: { left: margin, right: margin },
    };

    if (ficha.technical_data && ficha.technical_data.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40);
      doc.text(ficha.technicalDataTitle || 'Datos Técnicos', margin, cursorY);
      cursorY += 6;

      const technicalBody = ficha.technical_data.map(item => [item.label, `${item.value} ${item.unit || ''}`]);
      doc.autoTable({
        head: [['Característica', 'Valor']],
        body: technicalBody,
        ...fichaTableStyles,
        startY: cursorY,
      });
      cursorY = doc.autoTable.previous.finalY + 10;
    }

    if (ficha.components && ficha.components.length > 0) {
      if (cursorY > pageHeight - 40) {
        doc.addPage();
        cursorY = margin;
        await addFichaHeader();
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40);
      doc.text(ficha.componentsTitle || 'Componentes', margin, cursorY);
      cursorY += 6;

      const componentsBody = ficha.components.map(item => [item.label, item.value]);
      doc.autoTable({
        head: [['Componente', 'Marca/Valor']],
        body: componentsBody,
        ...fichaTableStyles,
        startY: cursorY,
      });
      cursorY = doc.autoTable.previous.finalY + 15;
    }
  }

  addFooter(doc);
  doc.save(`Fichas_Tecnicas_${quotationData.project.replace(/\s/g, '_')}.pdf`);
};