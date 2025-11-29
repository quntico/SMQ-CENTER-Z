import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { iconMap } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from '@/contexts/LanguageContext';
import IconPicker from './IconPicker';

const SidebarItem = ({
  section,
  isActive,
  onClick,
  isCollapsed,
  isEditorMode,
  onVisibilityToggle,

  onMoveUp,
  onMoveDown,
  onLabelChange,
  onIconChange,
  onDuplicate,
  onDelete,
  isFirst,
  isLast,

  dragHandleProps,
  isDragging
}) => {
  const { t } = useLanguage();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState("");
  const inputRef = useRef(null);

  // Logic to determine display label:
  // 1. User defined label (section.label)
  // 2. Translation (t(`sections.${section.id}`))
  // 3. Fallback to ID
  const displayLabel = section.label || t(`sections.${section.id}`) || section.id;

  useEffect(() => {
    setTempLabel(displayLabel);
  }, [displayLabel]);

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select all text for easy replacement
    }
  }, [isEditingLabel]);

  if (!section || !section.id) {
    return null;
  }

  const Icon = section.icon && iconMap[section.icon] ? iconMap[section.icon] : iconMap['FileText'];
  const isVisible = section.isVisible !== false;

  const handleSaveLabel = () => {
    if (tempLabel.trim() !== "" && tempLabel !== displayLabel) {
      onLabelChange(tempLabel);
    }
    setIsEditingLabel(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      setTempLabel(displayLabel);
      setIsEditingLabel(false);
    }
    e.stopPropagation();
  };

  const itemContent = (
    <div
      className={cn(
        "group relative flex items-center w-full cursor-pointer min-h-[40px]",
        isDragging && "opacity-50"
      )}
      onClick={(e) => {
        if (!isEditingLabel) onClick(e);
      }}
    >
      {/* Drag Handle - Only in Editor Mode */}
      {isEditorMode && !isCollapsed && (
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-1 opacity-30 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}

      <IconPicker
        value={section.icon}
        onChange={onIconChange}
        isEditorMode={isEditorMode && !section.isLocked}
        trigger={
          <div
            className={cn(
              "flex-shrink-0 transition-transform duration-200 p-1 rounded-md",
              isEditorMode && !section.isLocked ? "hover:bg-white/10 cursor-pointer" : ""
            )}
            onClick={(e) => isEditorMode && !section.isLocked && e.stopPropagation()}
          >
            <Icon className={cn(
              "w-5 h-5 led-blue-hover",
              isActive && "scale-110 led-blue-text",
              isCollapsed && "mx-auto"
            )} />
          </div>
        }
      />

      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden relative">
          {isEditorMode && isEditingLabel ? (
            <input
              ref={inputRef}
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-gray-900 text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none shadow-lg z-50 relative"
            />
          ) : (
            <span
              className={cn(
                "block truncate text-sm transition-all duration-200 select-none led-blue-hover",
                isActive ? "font-semibold led-blue-text" : "text-gray-300",
                isEditorMode && !section.isLocked && "hover:text-blue-400 cursor-text"
              )}
              onDoubleClick={(e) => {
                if (isEditorMode && !section.isLocked) {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingLabel(true);
                }
              }}
              title={isEditorMode ? "Doble clic para renombrar" : ""}
            >
              {displayLabel}
            </span>
          )}
        </div>
      )}

      {isActive && !isCollapsed && !isEditorMode && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Editor Controls - Only Visible in Editor Mode & Not Collapsed */}
      {isEditorMode && !isCollapsed && (
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-sm rounded-l-md pl-1 shadow-xl border-l border-gray-800/50 absolute right-0 h-full pr-1">

          {/* Rename Button (Direct Access) */}
          {!section.isLocked && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}
              className="p-1.5 hover:text-blue-400 text-gray-400 transition-colors rounded-md hover:bg-white/5"
              title="Renombrar"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Button (Direct Access) */}
          {!section.isLocked && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:text-red-400 text-gray-400 transition-colors rounded-md hover:bg-white/5"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Visibility Toggle */}
          {!section.isLocked && (
            <button
              onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }}
              className={cn(
                "p-1.5 transition-colors rounded-md hover:bg-white/5",
                isVisible ? "hover:text-blue-400 text-gray-400" : "text-gray-600"
              )}
              title={isVisible ? "Ocultar" : "Mostrar"}
            >
              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 hover:text-white text-gray-400 transition-colors rounded-md hover:bg-white/5" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-800 text-gray-200 z-[60]">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="cursor-pointer focus:bg-gray-800">
                <ArrowUp className="w-4 h-4 mr-2" /> Mover Arriba
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="cursor-pointer focus:bg-gray-800">
                <ArrowDown className="w-4 h-4 mr-2" /> Mover Abajo
              </DropdownMenuItem>

              {!section.isLocked && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(e); }} className="cursor-pointer focus:bg-gray-800">
                    <Copy className="w-4 h-4 mr-2" /> Duplicar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center px-3 py-2 my-1 rounded-lg transition-all duration-200 border border-transparent led-blue-box-hover",
        isActive && !isEditorMode
          ? "led-blue-box"
          : "",
        isEditorMode && isActive && "bg-blue-500/10 border-blue-500/30", // Distinct style for active in editor
        !isVisible && isEditorMode && "opacity-50 grayscale" // Visual cue for hidden items
      )}
    >
      {isCollapsed ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
            <TooltipContent side="right" className="bg-black text-white border-gray-700 z-50">
              <p>{displayLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        itemContent
      )}
    </motion.div>
  );
};

export default SidebarItem;