import React, { useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import {
  materialRenderers,
  materialCells,
} from '@jsonforms/material-renderers';
import { saveAs } from 'file-saver'; // installeren via 'npm install file-saver'

// Opmaak in App.css
import './App.css';

// Inlezen schema uitwisselmodel
import * as schema from './json_schema_Uitwisselmodel.json';
// Verwijder de eigenschap van de eerste regel
// delete schema["$schema"];
// Eerste regel nu even handmatig verwijderd, omdat het script niet blij is met de eigenschap $schema...
// Misschien later nog betere oplossing voor vinden, zodat direct uitwisselmodel uit Github gebruikt kan wordn.

// Inlezen UI schema uitwisselmodel (wordt nu nog niet gebruikt...)
import * as uischema from './json_schema_Uitwisselmodel_ui.json';

// Inlezen waarden vooringevulde velden
import * as initialData from './json_schema_Uitwisselmodel_data.json';

function App() {
  const [data, setData] = useState(initialData);
  const handleDownload = () => {
    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain;charset=utf-8' });
    saveAs(file, 'DDAS_gegevens.json');
    alert('Ingevoerde gegevens worden opgeslagen in de downloadfolder met de naam DDAS_gegevens.json.\r\nLet op: het bestand bevat gevoelige persoonsgegevens!');
  };
  return (
    <div className='App'>
    <h1>DDAS - Handmatige invoer gegevens</h1>
      <JsonForms
        schema={schema}
//        uischema={uischema} (nu uitgecommentarieerd, zodat JSONforms het formulier zelf opmaakt)
        data={data}
        renderers={materialRenderers}
        cells={materialCells}
        onChange={({ data, errors }) => setData(data)}
      />
      <button type="button" onClick={handleDownload}>
        Sla gegevens op
      </button>
    </div>
  );
}

export default App;
