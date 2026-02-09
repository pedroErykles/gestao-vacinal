import { Home, Syringe, Package, FileText, Calendar, BarChart3 } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'vacinas', label: 'Vacinas', icon: Syringe },
    { id: 'lotes', label: 'Lotes', icon: Package },
    { id: 'registros', label: 'Registros de Aplicação', icon: FileText },
    { id: 'campanhas', label: 'Campanhas', icon: Calendar },
    { id: 'relatorios', label: 'Relatório', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-700 p-2 rounded-lg">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg">Sistema de Vacinação</h1>
            <p className="text-xs text-blue-300">Gestão Municipal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-blue-800 border-l-4 border-white'
                  : 'hover:bg-blue-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-6 border-t border-blue-800">
        <div className="text-center text-xs text-blue-300">
          <p>Sistema de Gestão de</p>
          <p>Vacinação Municipal</p>
          <p className="mt-2">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}