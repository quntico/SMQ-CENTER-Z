import React from 'react';
import { motion } from 'framer-motion';
import { ChevronsLeft, ChevronsRight, Settings, Shield, LogOut, Edit } from 'lucide-react';
import SidebarItem from './SidebarItem';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useLanguage } from '@/contexts/LanguageContext';

const Sidebar = ({
  activeSection,
  onSectionSelect,
  onHomeClick,
  isCollapsed,
  setIsCollapsed,
  onAdminClick,
  isEditorMode,
  setIsEditorMode,
  sections,
  setSections,
  isAdminAuthenticated,
  onAdminLogin,
  onAdminLogout,
  isAdminView,
}) => {
  const { t } = useLanguage();
  const sidebarVariants = {
    collapsed: { width: '80px' },
    expanded: { width: '250px' },
  };

  const onDragEnd = (result) => {
    if (!result.destination || !isEditorMode) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  const toggleSectionVisibility = (id) => {
    const newSections = sections.map(section =>
      section.id === id ? { ...section, isVisible: !section.isVisible } : section
    );
    setSections(newSections);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <motion.div
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-black border-r border-gray-800 flex flex-col h-full text-white"
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 flex items-center justify-between border-b border-gray-800">
            {!isCollapsed && <span className="font-bold text-lg">{t('sidebar.menu')}</span>}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-full hover:bg-gray-800 transition-colors">
              {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </button>
          </div>

          <nav className="mt-4">
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index} isDragDisabled={!isEditorMode}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <SidebarItem
                            section={section}
                            isActive={activeSection === section.id}
                            isCollapsed={isCollapsed}
                            onClick={() => section.id === 'portada' ? onHomeClick() : onSectionSelect(section.id)}
                            isEditorMode={isEditorMode}
                            onVisibilityToggle={() => toggleSectionVisibility(section.id)}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </nav>
        </div>

        {isAdminView && (
          <div className="p-4 border-t border-gray-800 space-y-2">
            {isAdminAuthenticated && (
              <>
                <button
                  onClick={() => setIsEditorMode(!isEditorMode)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${isEditorMode ? 'bg-green-500/10 text-green-400' : 'hover:bg-gray-800'}`}
                >
                  <Edit size={20} />
                  {!isCollapsed && <span className="ml-4 font-semibold">{t('sidebar.editorMode')}</span>}
                </button>
                <button
                  onClick={onAdminClick}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Settings size={20} />
                  {!isCollapsed && <span className="ml-4 font-semibold">{t('sidebar.admin')}</span>}
                </button>
              </>
            )}
            <button
              onClick={isAdminAuthenticated ? onAdminLogout : onAdminLogin}
              className="w-full flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isAdminAuthenticated ? <LogOut size={20} className="text-red-500" /> : <Shield size={20} />}
              {!isCollapsed && <span className="ml-4 font-semibold">{isAdminAuthenticated ? t('sidebar.logout') : t('sidebar.login')}</span>}
            </button>
          </div>
        )}
      </motion.div>
    </DragDropContext>
  );
};

export default Sidebar;