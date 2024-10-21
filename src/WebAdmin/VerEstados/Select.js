import React from 'react';
import './Select.css'; // Asegúrate de importar el archivo CSS

const CustomSelect = ({ options, selectedOption, onOptionChange }) => {
  return (
    <div className="custom-select">
      <select 
        value={selectedOption} 
        onChange={(e) => onOptionChange(e.target.value)} 
        className="select-dropdown"
      >
        <option disabled value="">
          Selecciona una opción
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CustomSelect;
