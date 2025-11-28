import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { iconMap } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from '@/contexts/LanguageContext';

const SidebarItem = ({ 
  section, 
  isActive, 
  onClick, 
  isCollapsed, 
  isEditorMode,
  onVisibilityToggle,
  dragHandleProps,
  isDragging 
}) => {
  const { t } = useLanguage();

  if (!section || !section.id) {
    console.warn('SidebarItem: Invalid section data received, skipping render.', section);
    return null;
  }

  const Icon = section.icon && iconMap[section.icon] ? iconMap[section.icon] : iconMap['FileText'];
  const label = t(`sections.${section.id}`) || section.label || t('sections.unnamed');
  const isVisible = section.isVisible !== false;

  const itemContent = (
    <div
      className={cn(
        "group relative flex items-center w-full cursor-pointer",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
    >
      {isEditorMode && (
        <div 
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      )}
      
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-transform duration-200",
        isActive && "scale-110",
        isCollapsed && "mx-auto"
      )} />
      
      {!isCollapsed && (
        <span className={cn(
          "ml-3 font-medium text-sm truncate transition-all duration-200",
          isActive && "font-semibold"
        )}>
          {label}
        </span>
      )}
      
      {isActive && !isCollapsed && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {isEditorMode && !isCollapsed && !section.isLocked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVisibilityToggle();
          }}
          className="ml-auto p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-700 transition-opacity"
        >
          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center px-3 py-2.5 my-1 rounded-lg transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-gray-400 hover:text-white hover:bg-white/5",
        !isVisible && isEditorMode && "opacity-40 hover:opacity-60"
      )}
    >
      {isCollapsed ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
            <TooltipContent side="right" className="bg-black text-white border-gray-700">
              <p>{label}</p>
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