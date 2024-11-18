import React, { useEffect } from 'react';
import { downloadJSON } from './downloadJSON';

export function SaveShortcut({ data, schema, formLevering, formTrajecten, bestandsnaam }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Voorkom standaard opslaan
        // Alles in formAlgemeen stoppen - eerst de leveringen leegmaken en dan de met formTrajecten gevulde formLevering toevorgen
        data.leveringen = [];
        formLevering.schuldhulptrajecten = formTrajecten;
        data.leveringen.push(formLevering);
        downloadJSON(data, schema, bestandsnaam);
      }
    };

    // Event listener toevoegen
    window.addEventListener('keydown', handleKeyDown);

    // Event listener verwijderen bij unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, schema, formLevering, formTrajecten, bestandsnaam]);

  return null;
}
