import { useEffect } from 'react';
import { downloadJSON } from './downloadJSON';

export function SaveShortcut({ data, formLevering, formTrajecten, schema }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Voorkom standaard opslaan
        downloadJSON(data, formLevering, formTrajecten, schema);
      }
    };

    // Event listener toevoegen
    window.addEventListener('keydown', handleKeyDown);

    // Event listener verwijderen bij unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, schema, formLevering, formTrajecten]);

  return null;
}
