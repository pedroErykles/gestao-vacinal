import { Users, UserPlus } from 'lucide-react';

export function UsuariosPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Gestão de Usuários</h1>
        <p className="text-gray-600">Cadastro e gerenciamento de pacientes e profissionais</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-6 rounded-full">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl text-gray-900 mb-2">Em Desenvolvimento</h2>
        <p className="text-gray-600 mb-6">
          O módulo de gestão de usuários estará disponível em breve.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
          <UserPlus className="w-5 h-5" />
          <span>Funcionalidade em construção</span>
        </div>
      </div>
    </div>
  );
}
