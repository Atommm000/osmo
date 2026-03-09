import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="search-input-wrap">
      <input
        className="search-input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type="text"
      />
      <span className="search-input-icon">
        <Search size={16} />
      </span>
    </div>
  );
}
