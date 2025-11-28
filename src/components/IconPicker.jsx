import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { iconMap, iconList } from '@/lib/iconMap';
import { Search } from 'lucide-react';

const IconPicker = ({ value, onChange, children }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredIcons = iconList.filter(iconName =>
    iconName.toLowerCase().includes(search.toLowerCase())
  );

  const CurrentIcon = iconMap[value] || iconMap['FileText'];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverContent className="w-80 bg-gray-900 border-gray-700 text-white">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Seleccionar Icono</h4>
            <p className="text-sm text-gray-400">
              Busca y elige un icono para la característica.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar icono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = iconMap[iconName];
              return (
                <Button
                  key={iconName}
                  variant="outline"
                  size="icon"
                  className={`h-12 w-12 ${value === iconName ? 'bg-primary text-white' : ''}`}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                >
                  <IconComponent className="h-6 w-6" />
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;