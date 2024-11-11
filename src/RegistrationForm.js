import React, { useState } from 'react';
import { JsonForms } from '@jsonforms/react';
//import { vanillaRenderers, vanillaCells } from '@jsonforms/vanilla-renderers';
import 'bootstrap/dist/css/bootstrap.min.css';
import schema from './json_schema_Uitwisselmodel.json';
// import uischema from './uischema.json'; // Optioneel: UI-schema in apart bestand
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';


function RegistrationForm() {
  const [formData, setFormData] = useState({});

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Registratieformulier</h2>
      <JsonForms
        schema={schema}
        //uischema={uischema}
        data={formData}
        renderers={materialRenderers}
        cells={materialCells}
        onChange={({ data }) => setFormData(data)}
      />

      <div className="mt-4 p-3 bg-light border rounded">
        <h5>Ingevoerde gegevens:</h5>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}

export default RegistrationForm;