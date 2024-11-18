import React, { useEffect } from 'react';
import { downloadJSON } from './downloadJSON';

export function SaveShortcut({ data, schema, bestandsnaam }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Voorkom standaard opslaan
        downloadJSON(data, schema, bestandsnaam);
      }
    };

    // Event listener toevoegen
    window.addEventListener('keydown', handleKeyDown);

    // Event listener verwijderen bij unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, schema, bestandsnaam]);

  return null;
}
