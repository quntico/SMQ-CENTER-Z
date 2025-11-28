import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import SectionHeader from '@/components/SectionHeader';
import EditableField from '@/components/EditableField';
import IconPicker from '@/components/IconPicker';
import { iconMap } from '@/lib/iconMap';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  DollarSign,
  Eye as EyeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PowerButtons from '@/components/PowerButtons';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PDFPreviewModal from '@/components/PDFPreviewModal';

const formatCurrency = (value, currency = 'USD') => {
  if (typeof value !== 'number') {
    value = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const defaultContent = {
  subtitle:
    'Aquí puedes ver el desglose de la inversión. Marca o desmarca los componentes para ajustar el costo total.',
  taxRate: 16,
  currency: 'USD',
  sellerName: 'Nombre del Vendedor',
  sellerDepartment: 'DIRECCIÓN DE VENTAS',
  groups: [
    {
      id: 'group1',
      title: 'General',
      isOpen: true,
      items: [
        {
          id: 'item1',
          icon: 'Package',
          title: 'LÍNEA DE BARRAS DE CEREAL',
          subtitle: 'LCB 300',
          price: 180760,
          kw: 45, // kW instalados aprox
          isActive: true,
        },
        {
          id: 'item2',
          icon: 'Package',
          title: 'EMPAQUETADO PCT80',
          subtitle: 'EMPAQUE PRIMARIO',
          price: 64900,
          kw: 12,
          isActive: true,
        },
        {
          id: 'item3',
          icon: 'Package',
          title: 'EMPAQUETADO MASTER',
          subtitle: 'EMPAQUE SECUNDARIO AUTOMATICO',
          price: 78000,
          kw: 18,
          isActive: true,
        },
        {
          id: 'item4',
          icon: 'Package',
          title: 'PALETIZADO Y FLEJADO',
          subtitle: 'FIN DE LÍNEA AUTOMÁTICO',
          price: 87200,
          kw: 10,
          isActive: true,
        },
      ],
    },
  ],
};

const PropuestaDinamicaSection = ({
  sectionData,
  isEditorMode,
  onContentChange,
  quotationData,
  sections,
}) => {
  const { toast } = useToast();
  // Ensure sectionData.content is initialized, otherwise use defaultContent
  let mergedContent = { ...defaultContent, ...(sectionData.content || {}) };

  // If groups are empty or not an array, use default groups
  if (
    !mergedContent.groups ||
    !Array.isArray(mergedContent.groups) ||
    mergedContent.groups.length === 0
  ) {
    mergedContent.groups = defaultContent.groups;
  }

  const content = mergedContent;

  const [showPreview, setShowPreview] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState({
    logoUrl: '',
    logoPosition: { x: 148, y: 20 },
    logoSize: 45,
  });

  useEffect(() => {
    const initialTemplate = {
      logoUrl: quotationData.logo || '',
      logoPosition: { x: 148, y: 20 },
      logoSize: 45,
      ...(quotationData.pdf_template || {}),
    };
    if (quotationData.pdf_template?.logoUrl) {
      initialTemplate.logoUrl = quotationData.pdf_template.logoUrl;
    }
    setPdfTemplate(initialTemplate);
  }, [quotationData.logo, quotationData.pdf_template]);

  const updateContent = (newContent) => {
    onContentChange({...content, ...newContent});
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            'No se pudo cargar la imagen del logo para el PDF. Verifique que la URL es correcta y accesible.'
          )
        );
    });
  };

  const handleGeneratePDF = async () => {
    try {
      const doc = new jsPDF();
      await generatePdfContent(doc);
      doc.save(`Propuesta_Dinamica_${quotationData.project}.pdf`);
      toast({
        title: 'PDF Generado',
        description: 'La descarga de tu propuesta ha comenzado.',
      });
    } catch (error) {
      toast({
        title: 'Error al generar PDF',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const generatePdfContent = async (doc) => {
    const primaryColor = '#007BFF';
    const blackColor = '#000000';
    const whiteColor = '#ffffff';
    const grayColor = '#444444';
    const lightGrayColor = '#F5F5F5';

    const logoImage = await loadImage(pdfTemplate.logoUrl);
    if (logoImage) {
      const { logoSize, logoPosition } = pdfTemplate;
      const imgWidth = logoSize;
      const imgHeight = (logoImage.height * imgWidth) / logoImage.width;
      doc.addImage(
        logoImage,
        'PNG',
        logoPosition.x,
        logoPosition.y,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
    }

    doc.setFontSize(9);
    doc.setTextColor(grayColor);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 14, 15);
    doc.text('EMPRESA:', 14, 20);
    doc.text('PROYECTO:', 14, 25);
    doc.text('FECHA:', 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.text(quotationData.client || 'N/A', 35, 15);
    doc.text(quotationData.company || 'N/A', 35, 20);
    doc.text(quotationData.project || 'N/A', 35, 25);
    doc.text(
      format(new Date(), 'dd MMMM, yyyy', { locale: es }),
      35,
      30
    );

    doc.setFillColor(primaryColor);
    doc.rect(14, 35, 182, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(whiteColor);
    doc.text('PROPUESTA ECONÓMICA DINÁMICA', 18, 44);

    const tableStartY = 50;
    doc.setFillColor(blackColor);
    doc.rect(14, tableStartY, 126, 7, 'F');
    doc.setFillColor(primaryColor);
    doc.rect(140, tableStartY, 56, 7, 'F');
    doc.setFontSize(11);
    doc.setTextColor(whiteColor);
    doc.text('DESCRIPCIÓN', 18, tableStartY + 5);
    doc.text('IMPORTE', 168, tableStartY + 5, { align: 'center' });

    const tableBody = [];
    let total = 0;

    content.groups.forEach((group) => {
      const activeItems = group.items.filter((item) => item.isActive);
      if (activeItems.length > 0) {
        tableBody.push([
          {
            content: `\n${group.title.toUpperCase()}`,
            styles: {
              fontStyle: 'bold',
              fontSize: 10,
              textColor: blackColor,
            },
          },
          '',
        ]);
        activeItems.forEach((item) => {
          tableBody.push([
            {
              content: `•  ${item.title}: ${item.subtitle}`,
              styles: {
                cellPadding: { left: 5 },
                textColor: grayColor,
              },
            },
            {
              content: formatCurrency(item.price, content.currency),
              styles: {
                halign: 'right',
                textColor: grayColor,
              },
            },
          ]);
          total += item.price;
        });
      }
    });

    doc.autoTable({
      startY: tableStartY + 7,
      body: tableBody,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
      },
      columnStyles: {
        0: { cellWidth: 126 },
        1: { cellWidth: 56, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.cell.section === 'body') {
          data.cell.styles.fillColor =
            data.row.index % 2 === 0 ? whiteColor : lightGrayColor;
        }
      },
    });

    let finalY = doc.previousAutoTable.finalY + 5;
    if (finalY < 60) finalY = 60;

    doc.setFillColor(primaryColor);
    doc.rect(140, finalY, 56, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(whiteColor);
    doc.text('TOTAL', 144, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(total, content.currency), 194, finalY + 5, {
      align: 'right',
    });

    finalY += 12;
    doc.setFontSize(10);
    doc.setTextColor(blackColor);
    doc.text(`Más ${content.taxRate}% de I.V.A.`, 194, finalY, {
      align: 'right',
    });

    finalY += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('TÉRMINOS DE VENTA', 14, finalY);
    finalY += 2;

    const termBody = [];
    const creditCardIcon = '💳';
    const clockIcon = '🕒';

    const condicionesSection = sections.find(
      (s) => s.id === 'condiciones'
    );
    if (condicionesSection && condicionesSection.content) {
      const paymentTerms =
        condicionesSection.content.terms
          .map((t) => `${t.percentage}% ${t.title}`)
          .join(' | ');
      termBody.push([
        { content: creditCardIcon, styles: { halign: 'center' } },
        {
          content: 'Condiciones de Pago',
          styles: { fontStyle: 'bold' },
        },
        paymentTerms,
      ]);
    }

    const {
      phase1_duration = 0,
      phase2_duration = 0,
      phase3_duration = 0,
    } = quotationData;
    const totalDeliveryDays =
      phase1_duration + phase2_duration + phase3_duration;
    termBody.push([
      { content: clockIcon, styles: { halign: 'center' } },
      {
        content: 'Tiempo de Entrega',
        styles: { fontStyle: 'bold' },
      },
      `${totalDeliveryDays} días + Transporte.`,
    ]);

    doc.autoTable({
      startY: finalY,
      body: termBody,
      theme: 'grid',
      styles: {
        fontSize: 9,
        valign: 'middle',
        fillColor: whiteColor,
        lineColor: [200, 200, 200],
      },
      headStyles: { fillColor: primaryColor, textColor: whiteColor },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' },
      },
    });
    finalY = doc.previousAutoTable.finalY + 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(grayColor);
    doc.text(content.sellerName || '', 194, finalY, { align: 'right' });
    finalY += 4;
    doc.text(content.sellerDepartment || '', 194, finalY, {
      align: 'right',
    });

    doc.setFillColor(primaryColor);
    doc.rect(
      0,
      doc.internal.pageSize.height - 10,
      doc.internal.pageSize.width,
      10,
      'F'
    );
  };

  const handleFieldChange = (groupIndex, itemIndex, field, value) => {
    const newGroups = [...content.groups];
    newGroups[groupIndex].items[itemIndex][field] = value;
    updateContent({ groups: newGroups });
  };

  const handlePriceChange = (groupIndex, itemIndex, value) => {
    const numericValue = parseFloat(
      String(value).replace(/[^0-9.]/g, '')
    );
    if (!isNaN(numericValue)) {
      handleFieldChange(groupIndex, itemIndex, 'price', numericValue);
    }
  };

  const handleKwChange = (groupIndex, itemIndex, value) => {
    const numericValue =
      parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    handleFieldChange(groupIndex, itemIndex, 'kw', numericValue);
  };

  const handleGroupFieldChange = (groupIndex, field, value) => {
    const newGroups = [...content.groups];
    newGroups[groupIndex][field] = value;
    updateContent({ groups: newGroups });
  };

  const handleAddItem = (groupIndex) => {
    const newGroups = [...content.groups];
    newGroups[groupIndex].items.push({
      id: `item_${Date.now()}`,
      icon: 'FileText',
      title: 'Nuevo Item',
      subtitle: 'Descripción',
      price: 0,
      kw: 0,
      isActive: true,
    });
    updateContent({ groups: newGroups });
  };

  const handleAddGroup = () => {
    const newGroups = [...content.groups];
    newGroups.push({
      id: `group_${Date.now()}`,
      title: 'Nuevo Grupo',
      isOpen: true,
      items: [],
    });
    updateContent({ groups: newGroups });
  };

  const handleDuplicateItem = (groupIndex, itemIndex) => {
    const newGroups = [...content.groups];
    const itemToDuplicate = newGroups[groupIndex].items[itemIndex];
    const duplicatedItem = {
      ...itemToDuplicate,
      id: `item_${Date.now()}`,
    };
    newGroups[groupIndex].items.splice(itemIndex + 1, 0, duplicatedItem);
    updateContent({ groups: newGroups });
  };

  const handleRemoveItem = (groupIndex, itemIndex) => {
    const newGroups = [...content.groups];
    newGroups[groupIndex].items.splice(itemIndex, 1);
    updateContent({ groups: newGroups });
  };

  const handleMoveItem = (groupIndex, itemIndex, direction) => {
    const newGroups = [...content.groups];
    const items = newGroups[groupIndex].items;
    const newIndex = itemIndex + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const item = items.splice(itemIndex, 1)[0];
    items.splice(newIndex, 0, item);
    updateContent({ groups: newGroups });
  };

  const total = useMemo(() => {
    return content.groups.reduce((acc, group) => {
      return (
        acc +
        group.items.reduce((itemAcc, item) => {
          return item.isActive ? itemAcc + (item.price || 0) : itemAcc;
        }, 0)
      );
    }, 0);
  }, [content.groups]);

  const totalKw = useMemo(() => {
    return content.groups.reduce((acc, group) => {
      return (
        acc +
        group.items.reduce((itemAcc, item) => {
          return item.isActive ? itemAcc + (item.kw || 0) : itemAcc;
        }, 0)
      );
    }, 0);
  }, [content.groups]);

  const groupTotals = useMemo(() => {
    return content.groups.map((group) =>
      group.items.reduce(
        (acc, item) => (item.isActive ? acc + (item.price || 0) : acc),
        0
      )
    );
  }, [content.groups]);

  return (
    <>
      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        quotationData={quotationData}
        sections={sections}
        economicContent={content}
        pdfTemplate={pdfTemplate}
        setPdfTemplate={setPdfTemplate}
        activeTheme={quotationData.theme_key}
      />
      <div className="py-16 sm:py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            sectionData={{ ...sectionData, title: 'PROPUESTA DINÁMICA' }}
            isEditorMode={isEditorMode}
            onContentChange={updateContent}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-gray-400 max-w-xl mx-auto -mt-6 mb-12"
          >
            <EditableField
              value={content.subtitle}
              onSave={(val) =>
                updateContent({ subtitle: val })
              }
              isEditorMode={isEditorMode}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {content.groups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="bg-gray-900/50 rounded-2xl border border-gray-800"
                >
                  <div
                    className="p-4 flex justify-between items-center cursor-pointer"
                    onClick={() =>
                      handleGroupFieldChange(
                        groupIndex,
                        'isOpen',
                        !group.isOpen
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <EditableField
                        value={group.title}
                        isEditorMode={isEditorMode}
                        onSave={(val) =>
                          handleGroupFieldChange(
                            groupIndex,
                            'title',
                            val
                          )
                        }
                        className="text-xl font-bold"
                      />
                      <span className="text-sm text-gray-400">
                        Total del Grupo:{' '}
                        {formatCurrency(groupTotals[groupIndex], content.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditorMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateContent({
                              groups: content.groups.filter(
                                (g) => g.id !== group.id
                              ),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                      {group.isOpen ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {group.isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.items.map((item, itemIndex) => {
                            const Icon =
                              iconMap[item.icon] || DollarSign;
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                className={cn(
                                  'bg-black/30 rounded-lg p-4 border transition-colors hover:border-blue-500',
                                  item.isActive
                                    ? 'border-primary/30'
                                    : 'border-gray-800'
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                      {isEditorMode ? (
                                        <IconPicker
                                          value={item.icon}
                                          onChange={(newIcon) =>
                                            handleFieldChange(
                                              groupIndex,
                                              itemIndex,
                                              'icon',
                                              newIcon
                                            )
                                          }
                                        >
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0"
                                          >
                                            <Icon className="w-5 h-5 text-primary" />
                                          </Button>
                                        </IconPicker>
                                      ) : (
                                        <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                      )}
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-bold">{itemIndex + 1}.</span>
                                        <EditableField 
                                            value={item.title} 
                                            isEditorMode={isEditorMode} 
                                            onSave={(val) => handleFieldChange(groupIndex, itemIndex, 'title', val)} 
                                            className={cn("font-bold", item.isActive && "border-b-2 border-primary pb-1")}
                                            placeholder="Título del Item"
                                        />
                                      </div>
                                    </div>
                                    <div className="pl-11">
                                      <EditableField
                                        value={item.subtitle}
                                        isEditorMode={isEditorMode}
                                        onSave={(val) =>
                                          handleFieldChange(
                                            groupIndex,
                                            itemIndex,
                                            'subtitle',
                                            val
                                          )
                                        }
                                        className="text-sm text-gray-400 mt-1"
                                        placeholder="Descripción del item"
                                      />
                                    </div>
                                  </div>
                                  <PowerButtons
                                    isChecked={item.isActive}
                                    onCheckedChange={(val) =>
                                      handleFieldChange(
                                        groupIndex,
                                        itemIndex,
                                        'isActive',
                                        val
                                      )
                                    }
                                  />
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <EditableField
                                      value={formatCurrency(
                                        item.price, content.currency
                                      )}
                                      isEditorMode={isEditorMode}
                                      onSave={(val) =>
                                        handlePriceChange(
                                          groupIndex,
                                          itemIndex,
                                          val
                                        )
                                      }
                                      className={cn(
                                        'bg-gray-800/50 px-4 py-2 rounded-lg font-bold text-lg transition-all',
                                        !item.isActive &&
                                        'line-through text-gray-500'
                                      )}
                                      placeholder="$0.00"
                                    />
                                  </div>

                                  <div className="flex flex-col items-end w-32">
                                    <span className="text-xs text-gray-400 mb-1">
                                      kW instalados
                                    </span>
                                    <EditableField
                                      value={String(
                                        item.kw ?? 0
                                      )}
                                      isEditorMode={isEditorMode}
                                      onSave={(val) =>
                                        handleKwChange(
                                          groupIndex,
                                          itemIndex,
                                          val
                                        )
                                      }
                                      className="bg-gray-800/50 px-3 py-1 rounded-lg text-sm text-right"
                                      placeholder="0"
                                    />
                                  </div>

                                  {isEditorMode && (
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleMoveItem(
                                            groupIndex,
                                            itemIndex,
                                            -1
                                          )
                                        }
                                      >
                                        <ArrowUp size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleMoveItem(
                                            groupIndex,
                                            itemIndex,
                                            1
                                          )
                                        }
                                      >
                                        <ArrowDown size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleDuplicateItem(
                                            groupIndex,
                                            itemIndex
                                          )
                                        }
                                      >
                                        <Copy size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleRemoveItem(
                                            groupIndex,
                                            itemIndex
                                          )
                                        }
                                      >
                                        <Trash2
                                          size={14}
                                          className="text-red-500"
                                        />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        {isEditorMode && (
                          <div className="p-4 text-center">
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleAddItem(groupIndex)
                              }
                            >
                              + Añadir Item al Grupo
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {isEditorMode && (
                <div className="text-center">
                  <Button onClick={handleAddGroup}>
                    + Añadir Nuevo Grupo
                  </Button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-2xl font-bold mb-4">
                  Resumen de Inversión
                </h3>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="font-semibold">
                      {formatCurrency(total, content.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xl sm:text-3xl">
                    <span className="font-bold text-primary">
                      SUBTOTAL:
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency(total, content.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-700 pt-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Potencia instalada total:
                    </span>
                    <span className="font-semibold">
                      {totalKw.toFixed(2)} kW
                    </span>
                  </div>
                   <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-400">
                      Moneda:
                    </span>
                    <EditableField
                      value={content.currency}
                      isEditorMode={isEditorMode}
                      onSave={(val) => updateContent({ currency: val.toUpperCase() })}
                      className="text-right font-semibold"
                      inputClassName="text-right w-20"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-500 mt-2 text-right flex items-center justify-end">
                  PRECIOS MÁS&nbsp;
                  <EditableField
                    value={content.taxRate}
                    isEditorMode={isEditorMode}
                    onSave={(val) => updateContent({ taxRate: parseFloat(val) || 0 })}
                    className="inline-block"
                    inputClassName="w-12 text-right"
                  />
                  % DE I.V.A.
                </div>

                {isEditorMode && (
                  <div className="mt-6 p-4 border border-dashed border-gray-700 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-primary">
                      Firma del Vendedor
                    </h4>
                    <div className="space-y-2">
                      <EditableField
                        value={content.sellerName || ''}
                        onSave={(val) =>
                          updateContent({
                            sellerName: val,
                          })
                        }
                        isEditorMode={isEditorMode}
                        className="text-sm"
                        placeholder="Nombre del Vendedor"
                      />
                      <EditableField
                        value={content.sellerDepartment || ''}
                        onSave={(val) =>
                          updateContent({
                            sellerDepartment: val,
                          })
                        }
                        isEditorMode={isEditorMode}
                        className="text-sm"
                        placeholder="Cargo / Departamento"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
                    onClick={() =>
                      toast({
                        title: '🚧 Selección guardada (simulado).',
                      })
                    }
                  >
                    Guardar Selección
                  </Button>
                  {isEditorMode && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full flex items-center gap-2"
                      onClick={() => setShowPreview(true)}
                    >
                      <EyeIcon size={16} /> Vista Previa PDF
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={handleGeneratePDF}
                  >
                    Generar Cotización PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropuestaDinamicaSection;