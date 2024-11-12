import React, { useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import originalSchema from './json_schema_Uitwisselmodel.json';
import { Tabs, Tab } from 'react-bootstrap';

// Maak een schema dat exact één levering afdwingt
const schemaSingleDelivery = {
  ...originalSchema,
  properties: {
    ...originalSchema.properties,
    leveringen: {
      ...originalSchema.properties.leveringen,
      minItems: 1,
      maxItems: 1  // Zorgt ervoor dat slechts één levering mogelijk is
    }
  }
};

// Voorgevuld formData met één lege levering en nieuwe velden
const initialFormData = {
  startdatumLevering: "",
  einddatumLevering: "",
  aanleverdatumEnTijd: "",
  codeGegevensleverancier: "",
  leveringen: [
    {
      teller: 1,
      aanleverende_organisatie: {
        "(Statutaire) Naam": "",
        "KvK-nummer": "",
        "postcode": "",
        "gemeentecode": "",
        "contactpersonen": [
          {
            email: "",
            functietitel: "",
            naam: "",
            telefoonnummer: ""
          }
        ]
      },
      schuldhulptrajecten: []  // Lege array voor schuldhulptrajecten
    }
  ]
};

// UI-schema's voor de verschillende tabbladen
const uischemaGeneral = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Group",
      label: "Leveringsinformatie",
      elements: [
        { type: "Control", scope: "#/properties/startdatumLevering" },
        { type: "Control", scope: "#/properties/einddatumLevering" },
        { type: "Control", scope: "#/properties/aanleverdatumEnTijd" },
        { type: "Control", scope: "#/properties/codeGegevensleverancier" }
      ]
    },
    {
      type: "Group",
      label: "Aanleverende Organisatie",
      elements: [
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/(Statutaire) Naam" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/KvK-nummer" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/postcode" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/gemeentecode" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/contactpersonen" }
      ]
    }
  ]
};

const uischemaSchuldhulptrajecten = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten" }
  ]
};

function RegistrationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("general");

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Registratieformulier</h2>
      
      <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-3">
        <Tab eventKey="general" title="Levering">
          <div className="p-3 border rounded bg-light">
            <h5>Levering - Algemene Gegevens</h5>
            <JsonForms
              schema={schemaSingleDelivery}
              uischema={uischemaGeneral}
              data={formData}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data }) => setFormData(data)}
            />
          </div>
        </Tab>

        <Tab eventKey="schuldhulptrajecten" title="Schuldhulptrajecten">
          <div className="p-3 border rounded bg-light">
            <h5>Levering - Schuldhulptrajecten</h5>
            <JsonForms
              schema={schemaSingleDelivery}
              uischema={uischemaSchuldhulptrajecten}
              data={formData}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data }) => setFormData(data)}
            />
          </div>
        </Tab>
      </Tabs>

      <div className="mt-4 p-3 bg-light border rounded">
        <h5>Ingevoerde gegevens:</h5>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}

export default RegistrationForm;