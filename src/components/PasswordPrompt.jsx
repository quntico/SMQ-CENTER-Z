import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, LogIn, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PasswordPrompt = ({ onCorrectPassword, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'arez') {
      setError(false);
      onCorrectPassword();
      toast({
        title: 'Acceso Concedido',
        description: 'Bienvenido, Administrador.',
      });
    } else {
      setError(true);
      setPassword('');
      toast({
        title: 'Acceso Denegado',
        description: 'La contraseña es incorrecta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative bg-[#0a0a0a] border border-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-md text-center"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
          onClick={onCancel}
        >
          <X size={20} />
        </Button>
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acceso de Administrador</h2>
        <p className="text-gray-400 mb-6">
          Por favor, ingrese la contraseña para continuar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`text-center text-lg tracking-widest ${error ? 'border-destructive ring-2 ring-destructive/50' : ''}`}
            autoFocus
          />
          <Button type="submit" className="w-full" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Acceder
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PasswordPrompt;