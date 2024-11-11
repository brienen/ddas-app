import React from 'react';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers } from '@jsonforms/material-renderers';

const App = () => {
  const schema = "./json_schema_Uitwisselmodel.json";

  return (
    <JsonForms
      schema={schema}
      renderers={materialRenderers}
    />
  );
};

export default App;