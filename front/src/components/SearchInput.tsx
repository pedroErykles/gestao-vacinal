interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Buscar..."}
        style={{ border: 'none', outline: 'none', width: '90%' }}
      />
    </div>
  );
};