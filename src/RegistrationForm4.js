import React, { useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { Tabs, Tab, Button } from 'react-bootstrap';

import originalSchema from './json_schema_Uitwisselmodel.json';

const startdatumLevering = "2024-01-01";
const einddatumLevering = "2024-12-31";
function currentDateTime() {
  const today = new Date();
  const currentDateTime = today.getFullYear() + "-" + (today.getMonth() + 1).toString() + "-" + today.getDate() + "T" + (today.getHours().toString().length < 2 ? "0" + today.getHours() : today.getHours()) + ":" + (today.getMinutes().toString().length < 2 ? "0" + today.getMinutes() : today.getMinutes()) + ":00.000+01:00";
  console.log("datum-tijd: " + currentDateTime);
  return currentDateTime;
}

const sharedDefs = originalSchema.$defs || originalSchema.definitions || {}; // nodig om het schema op te delen

// Hoofdschema met verwijzing naar gedeelde definities
const schemaAlgemeen = {
  $schema: originalSchema.$schema,
  type: originalSchema.type,
  properties: {
    startdatumLevering: originalSchema.properties.startdatumLevering,
    einddatumLevering: originalSchema.properties.einddatumLevering,
    aanleverdatumEnTijd: originalSchema.properties.aanleverdatumEnTijd,
    codeGegevensleverancier: originalSchema.properties.codeGegevensleverancier,
    leveringen: {
      ...originalSchema.properties.leveringen,
      minItems: 1,
      maxItems: 1  // Zorgt ervoor dat slechts één levering mogelijk is
    }
  },
  required: originalSchema.required,
  $defs: sharedDefs // Voeg gedeelde definities toe
};

// Leveringenschema met gedeelde definities
const schemaLevering = {
  ...originalSchema.properties.leveringen.items,
  $defs: sharedDefs // Voeg gedeelde definities toe
};

// Schuldhulptrajectenschema met gedeelde definities
const schemaTrajecten = {
//  ...schemaLevering.properties.schuldhulptrajecten.items,
  ...originalSchema.properties.leveringen.items.properties.schuldhulptrajecten.items,
  $defs: sharedDefs // Voeg gedeelde definities toe
};
// Meerdere trajecten mogelijk - dus een array maken
const schemaTrajectenArray = {
  type: "array",
  items: schemaTrajecten,
  $defs: schemaTrajecten.$defs
};

// Voorgevuld formData met één lege levering en nieuwe velden
const initialFormData = {
  startdatumLevering: startdatumLevering,
  einddatumLevering: einddatumLevering,
  aanleverdatumEnTijd: currentDateTime(),
  codeGegevensleverancier: "DDAS-APP",
  leveringen: [
    {
      teller: 1,  // er is 1 levering met teller = 1
      aanleverende_organisatie: {},
      schuldhulptrajecten: []  // Lege array voor schuldhulptrajecten
    }
  ]
};

// UI-schema's voor de verschillende tabbladen
const uischemaAlgemeen = {
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
    }
  ]
};

const uischemaLevering = {
  type: "VerticalLayout",
  label: "Aanleverende Organisatie",
  elements: [
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/(Statutaire) Naam" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/KvK-nummer" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/postcode" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/gemeentecode" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/contactpersonen" },
  ]
};

const uischemaTrajecten = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#" }
    // {
    //   type: "Group",
    //   label: "Algemeen",
    //   elements: [
    //     { type: "Control", scope: "#/properties/gemeentecode" },
    //     { type: "Control", scope: "#/properties/startdatum" },
    //     { type: "Control", scope: "#/properties/einddatum" },
    //     { type: "Control", scope: "#/properties/toekenningsdatum" },
    //     { type: "Control", scope: "#/properties/omschrijving" },
    //     { type: "Control", scope: "#/properties/totaalSchuldbedragBijAanvangSchuld" }
    //   ]
    // },
    // {
    //   type: "Group",
    //   label: "Client en Schulden",
    //   elements: [
    //     { type: "Control", scope: "#/properties/client" },
    //     { type: "Control", scope: "#/properties/schulden" }
    //   ]
    // },
    // {
    //   type: "Group",
    //   label: "Proces",
    //   elements: [
    //     { type: "Control", scope: "#/properties/aanmelding" },
    //     { type: "Control", scope: "#/properties/intake" },
    //     { type: "Control", scope: "#/properties/planVanAanpak" },
    //     { type: "Control", scope: "#/properties/stabilisatie" },
    //     { type: "Control", scope: "#/properties/begeleiding" },
    //     { type: "Control", scope: "#/properties/oplossing" },
    //     { type: "Control", scope: "#/properties/schuldregeling" },
    //     { type: "Control", scope: "#/properties/uitstroom" },
    //     { type: "Control", scope: "#/properties/nazorg" }
    //   ]
    // },
    // {
    //   type: "Group",
    //   label: "Overige",
    //   elements: [
    //     { type: "Control", scope: "#/properties/crisisinterventies" },
    //     { type: "Control", scope: "#/properties/informatieEnAdvies" },
    //     { type: "Control", scope: "#/properties/voorlopigeVoorzieningen" },
    //     { type: "Control", scope: "#/properties/moratoria" }
    //   ]
    // }
  ]
};

function RegistrationForm() {

  const [formAlgemeen, setFormAlgemeen] = useState(initialFormData);
  const [formLevering, setFormLevering] = useState(
    initialFormData.leveringen && initialFormData.leveringen.length > 0
      ? initialFormData.leveringen[0]
      : {}
  );
  // Controleer of er bestaande schuldhulptrajecten zijn in de initiële levering en gebruik deze als initiële waarde
  const [formTrajecten, setFormTrajecten] = useState(
    initialFormData.leveringen && initialFormData.leveringen.length > 0 &&
    initialFormData.leveringen[0].schuldhulptrajecten
      ? initialFormData.leveringen[0].schuldhulptrajecten
      : []
  );
  const [activeTab, setActiveTab] = useState("start");

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  const handleDownload = () => {
    // Maak de leveringen-array in formAlgemeen leeg
    formAlgemeen.leveringen = [];
    // Voeg de met formTrajecten gevulde formLevering toe aan formAlgemeen.leveringen
    formLevering.schuldhulptrajecten = formTrajecten;
    formAlgemeen.leveringen.push(formLevering);
    const json = JSON.stringify(formAlgemeen, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formData.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setFormAlgemeen(json);
          if (json.leveringen && json.leveringen.length > 0) setFormLevering(json.leveringen[0]);
          if (json.leveringen && json.leveringen.length > 0 && json.leveringen[0].schuldhulptrajecten) setFormTrajecten(json.leveringen[0].schuldhulptrajecten);
        } catch (error) {
          console.error("Error parsing JSON file", error);
          alert("Ongeldig JSON-bestand.");
        }
      };
      reader.readAsText(file);
    }
  };

  const goToNextTab = () => {
    const tabOrder = ["start", "general", "schuldhulptrajecten", "export"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const goToPreviousTab = () => {
    const tabOrder = ["start", "general", "schuldhulptrajecten", "export"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">DDAS-Invoerapp</h2>

      <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-3">

        <Tab eventKey="start" title="Start">
          <div className="p-3 border rounded bg-light">
            <h5>Welkom bij de DDAS-Importapp</h5>
            <p>Vul alle formulieren in en druk op export. Hier nog diverse informatie om uit te leggen.</p>
            <input type="file" accept="application/json" onChange={handleFileUpload} className="mt-3" />
            <div className="d-flex justify-content-between mt-3">
              <Button variant="primary" onClick={goToNextTab}>
                Volgende
              </Button>
            </div>
          </div>
        </Tab>

        <Tab eventKey="general" title="Algemene Gegevens">
          <div className="p-3 border rounded bg-light">
            <h5>Algemene Gegevens</h5>
            <p>Vul de informatie in met betrekking tot de levering en de betrokken organisatie.</p>
            <JsonForms
              schema={schemaAlgemeen}
              uischema={uischemaAlgemeen}
              data={formAlgemeen}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data, errors }) => setFormAlgemeen(data)}
            />
            <JsonForms
              schema={schemaLevering}
              uischema={uischemaLevering}
              data={formLevering}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data, errors }) => setFormLevering(data)}
            />
            <div className="d-flex justify-content-between mt-3">
              <Button variant="primary" onClick={goToPreviousTab}>
                Vorige
              </Button>
              <Button variant="primary" onClick={goToNextTab}>
                Volgende
              </Button>
            </div>
          </div>
        </Tab>

        <Tab eventKey="schuldhulptrajecten" title="Schuldhulptrajecten">
          <div className="p-3 border rounded bg-light">
            <h5>Schuldhulptrajecten</h5>
            <p>Vul de gegevens in met betrekking tot schuldhulptrajecten die binnen deze levering vallen.</p>
            <JsonForms
              schema={schemaTrajectenArray}
              uischema={uischemaTrajecten}
              data={formTrajecten}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data, errors }) => setFormTrajecten(data)}
            />

            <div className="d-flex justify-content-between mt-3">
              <Button variant="primary" onClick={goToPreviousTab}>
                Vorige
              </Button>
              <Button variant="primary" onClick={goToNextTab}>
                Volgende
              </Button>
            </div>
          </div>
        </Tab>

        <Tab eventKey="export" title="Exporteren">
          <div className="p-3 border rounded bg-light">
            <h5>Exporteer Gegevens</h5>
            <p>Klik op de knop hieronder om de ingevulde gegevens als JSON-bestand te downloaden.</p>
            <Button variant="primary" onClick={handleDownload}>Download JSON Data</Button>
            <div className="d-flex justify-content-between mt-3">
              <Button variant="primary" onClick={goToPreviousTab}>
                Vorige
              </Button>
            </div>
          </div>
        </Tab>
      </Tabs>

      <div className="mt-4 p-3 bg-light border rounded">
        <h5>Debug: Ingevoerde gegevens:</h5>
        <h6>formAlgemeen</h6>
        <pre>{JSON.stringify(formAlgemeen, null, 2)}</pre>
        <hr />
        <h6>formLevering</h6>
        <pre>{JSON.stringify(formLevering, null, 2)}</pre>
        <hr />
        <h6>formTrajecten</h6>
        <pre>{JSON.stringify(formTrajecten, null, 2)}</pre>
      </div>
    </div>
  );
}

export default RegistrationForm;