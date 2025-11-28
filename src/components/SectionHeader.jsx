import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import EditableField from '@/components/EditableField';

const SectionHeader = ({ sectionData, isEditorMode, onContentChange }) => {
  const { t } = useLanguage();
  
  const handleTitleSave = (newTitle) => {
    if (onContentChange) {
      onContentChange({ title: newTitle });
    }
  };

  const titleKey = `sections.${sectionData.id}`;
  const defaultTitle = t(titleKey);
  const title = sectionData.content?.title || (defaultTitle !== titleKey ? defaultTitle : sectionData.label);
  
  return (
    <div className="text-center mb-12">
      <EditableField
        tag="h2"
        value={title}
        onSave={handleTitleSave}
        isEditorMode={isEditorMode}
        className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center"
        inputClassName="text-center"
        placeholder="Título de la sección"
      />
    </div>
  );
};

export default SectionHeader;