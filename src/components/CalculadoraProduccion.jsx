import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import SectionHeader from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import ResultadosClave from '@/components/ResultadosClave';
import AnalisisRentabilidad from '@/components/AnalisisRentabilidad';

const sectionData = {
    id: 'calculadora_prod',
    label: 'Calculadora de Producción',
    icon: 'Calculator',
    description: 'Estima la producción, costos y rentabilidad de tu línea de producción de tejas.'
};

const defaultInitialValues = {
  ancho_teja: 900,
  largo_teja: 1000,
  peso_teja: 4500,
  capacidad_produccion: 300,
  eficiencia_linea: 90,
  horas_operacion: 8,
  dias_operacion: 22,
  costo_mp: 15,
  costo_empaque: 0,
  costo_operativo: 120,
  precio_venta: 300,
};

const ParametroItem = ({ label, value, onValueChange, unit, step, min, max, isSlider = false }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (parseFloat(inputValue) !== value) {
      setInputValue(value.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue) || inputValue.trim() === '') {
      setInputValue(value.toString());
    } else {
      onValueChange(numValue);
    }
  };

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <div className="flex items-center gap-2">
          <Input 
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="w-28 h-8 text-right bg-black border-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            step={step}
            min={min}
            max={max}
          />
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      </div>
      {isSlider && (
        <Slider
          value={[value]}
          onValueChange={(val) => onValueChange(val[0])}
          max={max}
          min={min}
          step={step}
        />
      )}
    </div>
  );
};

const CalculadoraProduccion = ({ quotationData, isEditorMode, activeTheme }) => {
  const { toast } = useToast();
  const [values, setValues] = useState(defaultInitialValues);
  const [results, setResults] = useState({});
  const [rentabilidad, setRentabilidad] = useState({});

  useEffect(() => {
    const config = quotationData.calculator_config;
    if (config) {
      setValues({
        ancho_teja: config.ancho_teja || defaultInitialValues.ancho_teja,
        largo_teja: config.largo_teja || defaultInitialValues.largo_teja,
        peso_teja: config.peso_teja || defaultInitialValues.peso_teja,
        capacidad_produccion: config.capacidad_produccion || defaultInitialValues.capacidad_produccion,
        eficiencia_linea: config.eficiencia_linea || defaultInitialValues.eficiencia_linea,
        horas_operacion: config.horas_operacion || defaultInitialValues.horas_operacion,
        dias_operacion: config.dias_operacion || defaultInitialValues.dias_operacion,
        costo_mp: config.costo_mp || defaultInitialValues.costo_mp,
        costo_empaque: config.costo_empaque || defaultInitialValues.costo_empaque,
        costo_operativo: config.costo_operativo || defaultInitialValues.costo_operativo,
        precio_venta: config.precio_venta || defaultInitialValues.precio_venta,
      });
    } else {
        setValues(defaultInitialValues);
    }
  }, [quotationData.calculator_config]);
  
  const handleSave = async () => {
    const { error } = await supabase
      .from('quotations')
      .update({ calculator_config: values })
      .eq('theme_key', activeTheme);

    if (error) {
      toast({ title: "Error", description: "No se pudieron guardar los parámetros.", variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: "Parámetros de la calculadora guardados." });
    }
  };
  
  useEffect(() => {
    // Cálculos de Producción
    const peso_teja_kg = values.peso_teja / 1000;
    const capacidad_kg_h_real = values.capacidad_produccion * (values.eficiencia_linea / 100);
    
    const tejas_por_hora = peso_teja_kg > 0 ? capacidad_kg_h_real / peso_teja_kg : 0;
    const tejas_por_min_real = tejas_por_hora / 60;
    
    const produccion_diaria_tejas = tejas_por_hora * values.horas_operacion;
    const produccion_mensual_tejas = produccion_diaria_tejas * values.dias_operacion;
    const produccion_mensual_kg = (produccion_mensual_tejas * peso_teja_kg);

    setResults({
      tejas_por_hora: Math.round(tejas_por_hora),
      tejas_por_min_real: Math.round(tejas_por_min_real),
      produccion_diaria_tejas: Math.round(produccion_diaria_tejas),
      produccion_mensual_tejas: Math.round(produccion_mensual_tejas),
      produccion_mensual_kg: Math.round(produccion_mensual_kg),
    });

    // Cálculos de Rentabilidad
    const costo_mp_total = produccion_mensual_tejas * values.costo_mp;
    const costo_empaque_total = produccion_mensual_tejas * values.costo_empaque;
    const costo_operativo_total = values.costo_operativo * values.horas_operacion * values.dias_operacion;
    const costo_total_produccion = costo_mp_total + costo_empaque_total + costo_operativo_total;
    const ingresos_totales = produccion_mensual_tejas * values.precio_venta;
    const utilidad_bruta = ingresos_totales - costo_total_produccion;
    const margen_bruto = ingresos_totales > 0 ? (utilidad_bruta / ingresos_totales) * 100 : 0;

    setRentabilidad({
      costo_total_produccion,
      ingresos_totales,
      utilidad_bruta,
      margen_bruto,
    });
  }, [values]);

  const sections = {
    produccion: [
      { id: 'ancho_teja', label: 'Ancho de Teja', unit: 'mm', min: 100, max: 1200, step: 10 },
      { id: 'largo_teja', label: 'Largo de Teja', unit: 'mm', min: 200, max: 2000, step: 10 },
      { id: 'peso_teja', label: 'Peso por Teja', unit: 'gr', min: 1000, max: 10000, step: 100 },
      { id: 'capacidad_produccion', label: 'Capacidad de Producción', unit: 'kg/h', min: 300, max: 600, step: 10, isSlider: true }, // Rango y step actualizados
      { id: 'eficiencia_linea', label: 'Eficiencia de Línea', unit: '%', min: 50, max: 100, step: 1, isSlider: true },
    ],
    operacion: [
      { id: 'horas_operacion', label: 'Horas por Turno', unit: 'hrs', min: 1, max: 24, step: 1 },
      { id: 'dias_operacion', label: 'Días por Mes', unit: 'días', min: 1, max: 31, step: 1 },
    ],
    costos: [
      { id: 'costo_mp', label: 'Costo Materia Prima / teja', unit: 'MXN', min: 1, max: 100, step: 1 },
      { id: 'costo_empaque', label: 'Costo Empaque / teja', unit: 'MXN', min: 0, max: 50, step: 0.5 },
      { id: 'costo_operativo', label: 'Costo Operativo / hora', unit: 'MXN', min: 50, max: 1000, step: 10 },
      { id: 'precio_venta', label: 'Precio de Venta / teja', unit: 'MXN', min: 10, max: 500, step: 1 },
    ]
  };

  const updateValue = (id, newValue) => {
    setValues(prev => ({ ...prev, [id]: newValue }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto py-8"
    >
      <SectionHeader sectionData={sectionData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Columna de Parámetros */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Parámetros de Producción</h3>
            <div className="space-y-3">
              {sections.produccion.map(p => <ParametroItem key={p.id} {...p} value={values[p.id]} onValueChange={(val) => updateValue(p.id, val)} />)}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Parámetros de Operación</h3>
            <div className="space-y-3">
              {sections.operacion.map(p => <ParametroItem key={p.id} {...p} value={values[p.id]} onValueChange={(val) => updateValue(p.id, val)} />)}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Parámetros de Costos</h3>
            <div className="space-y-3">
              {sections.costos.map(p => <ParametroItem key={p.id} {...p} value={values[p.id]} onValueChange={(val) => updateValue(p.id, val)} />)}
            </div>
          </div>
          {isEditorMode && (
              <Button onClick={handleSave} className="w-full mt-4">Guardar Parámetros</Button>
          )}
        </div>

        {/* Columna de Resultados */}
        <div className="lg:col-span-2 space-y-8">
          <ResultadosClave results={results} rentabilidad={rentabilidad} />
          
          <div className="bg-black border border-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Análisis de Rentabilidad</h3>
              </div>
              <AnalisisRentabilidad rentabilidad={rentabilidad} quotationData={quotationData} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CalculadoraProduccion;