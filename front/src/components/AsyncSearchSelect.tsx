import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface AsyncSearchSelectProps<T> {
  fetchData: (query: string) => Promise<T[]>;
  renderItem: (item: T) => React.ReactNode;
  getDisplayValue: (item: T) => string;
  onSelect: (item: T | null) => void;
  label: string;
  placeholder?: string;
  initialValue?: T | null;
  clearAfterSelect?: boolean; 
}

export function AsyncSearchSelect<T>({ 
  fetchData, 
  renderItem, 
  getDisplayValue, 
  onSelect,
  label, 
  placeholder,
  initialValue,
  clearAfterSelect = false
}: AsyncSearchSelectProps<T>) {
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(initialValue || null);
  
  const debouncedQuery = useDebounce(query, 500);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValue) {
      setSelectedItem(initialValue);
      setQuery(getDisplayValue(initialValue));
    } else {
      if (initialValue === null && selectedItem !== null) {
        setSelectedItem(null);
        setQuery('');
      }
    }
  }, [initialValue]); 

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3 || (selectedItem && !clearAfterSelect)) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchData(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Erro na busca:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    onSelect(item);
    
    if (clearAfterSelect) {
      setSelectedItem(null);
      setQuery('');
    } else {
      setSelectedItem(item);
      setQuery(getDisplayValue(item));
    }
    
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedItem(null);
    setQuery('');
    setResults([]);
    onSelect(null);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (selectedItem && !clearAfterSelect) {
        setSelectedItem(null);
        onSelect(null);
    }

    if (val === '') {
      setIsOpen(false);
      setResults([]);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="block text-sm mb-2 font-medium">{label}</label>}
      
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
          placeholder={placeholder || "Digite 3 letras..."}
          value={(!clearAfterSelect && selectedItem) ? getDisplayValue(selectedItem) : query}
          onChange={handleInputChange}
          onFocus={() => {
             if (query.length >= 3) setIsOpen(true);
          }}
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Search className="w-5 h-5" />}
        </div>

        {(query || (selectedItem && !clearAfterSelect)) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && results.length === 0 && !isLoading && query.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  );
}