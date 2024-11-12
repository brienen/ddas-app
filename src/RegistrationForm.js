import React, { useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import originalSchema from './json_schema_Uitwisselmodel.json';
import { Tabs, Tab, Button } from 'react-bootstrap';

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
    {
      type: "Group",
      label: "Algemeen",
      elements: [
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/startdatum" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/einddatum" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/toekenningsdatum" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/omschrijving" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/totaalSchuldbedragBijAanvangSchuld" }
      ]
    },
    {
      type: "Group",
      label: "Client en Schulden",
      elements: [
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/client" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/schulden" }
      ]
    },
    {
      type: "Group",
      label: "Proces",
      elements: [
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/aanmelding" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/intake" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/planVanAanpak" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/stabilisatie" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/begeleiding" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/oplossing" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/schuldregeling" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/uitstroom" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/nazorg" }
      ]
    },
    {
      type: "Group",
      label: "Overige",
      elements: [
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/crisisinterventies" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/informatieEnAdvies" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/voorlopigeVoorzieningen" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/schuldhulptrajecten/items/properties/moratoria" }
      ]
    }
  ]
};

function RegistrationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("start");

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  const handleDownload = () => {
    const json = JSON.stringify(formData, null, 2);
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
          setFormData(json);
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
              schema={schemaSingleDelivery}
              uischema={uischemaGeneral}
              data={formData}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data }) => setFormData(data)}
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
              schema={schemaSingleDelivery}
              uischema={uischemaSchuldhulptrajecten}
              data={formData}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data }) => setFormData(data)}
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
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}

export default RegistrationForm;