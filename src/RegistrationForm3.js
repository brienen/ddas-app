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
const singleDeliveryDefinition = {
  ...schemaSingleDelivery.properties.leveringen.items,
  $defs: { ...schemaSingleDelivery.$defs }
};


// Basis-initialisatie van formulierdata
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
      schuldhulptrajecten: [
        {
          startdatum: "",
          einddatum: "",
          toekenningsdatum: "",
          omschrijving: "",
          totaalSchuldbedragBijAanvangSchuld: 0,
          client: [],
          schulden: []
        }
      ]
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
        { type: "Control", scope: "#/properties/leveringen" },
        { type: "Control", scope: "#/properties/leveringen/0/properties/aanleverende_organisatie/properties/(Statutaire) Naam" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/(Statutaire) Naam" },
        { type: "Control", scope: "#/properties/leveringen/0/properties/aanleverende_organisatie/properties/KvK-nummer" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/postcode" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/gemeentecode" },
        { type: "Control", scope: "#/properties/leveringen/items/properties/aanleverende_organisatie/properties/contactpersonen" }
      ]
    }
  ]
};

const uischemaSchuldhulptrajecten = {
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/schuldhulptrajecten",
      "options": {
        //"elementLabelProp": "omschrijving",
        "showSortButtons": true,
        "detail": {
          type: "VerticalLayout",
          elements: [
            {
              type: "Group",
              label: "Algemeen",
              elements: [
                { type: "Control", scope: "#/properties/startdatum" },
                { type: "Control", scope: "#/properties/einddatum" },
                { type: "Control", scope: "#/properties/toekenningsdatum" },
                { type: "Control", scope: "#/properties/omschrijving" },
                { type: "Control", scope: "#/properties/totaalSchuldbedragBijAanvangSchuld" }
              ]
            },
            {
              type: "Group",
              label: "Client en Schulden",
              elements: [
                { type: "Control", scope: "#/properties/client" },
                { type: "Control", scope: "#/properties/schulden" }
              ]
            },
            {
              type: "Group",
              label: "Proces",
              elements: [
                { type: "Control", scope: "#/properties/aanmelding" },
                { type: "Control", scope: "#/properties/intake" },
                { type: "Control", scope: "#/properties/planVanAanpak" },
                { type: "Control", scope: "#/properties/stabilisatie" },
                { type: "Control", scope: "#/properties/begeleiding" },
                { type: "Control", scope: "#/properties/oplossing" },
                { type: "Control", scope: "#/properties/schuldregeling" },
                { type: "Control", scope: "#/properties/uitstroom" },
                { type: "Control", scope: "#/properties/nazorg" }
              ]
            },
            {
              type: "Group",
              label: "Overige",
              elements: [
                { type: "Control", scope: "#/properties/crisisinterventies" },
                { type: "Control", scope: "#/properties/informatieEnAdvies" },
                { type: "Control", scope: "#/properties/voorlopigeVoorzieningen" },
                { type: "Control", scope: "#/properties/moratoria" }
              ]
            }
          ]
        }
      }
    }
  ]
};

function RegistrationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("start");

  // Initieer specifiek de schuldhulptrajecten vanuit leveringen
  const [formDataSchuldhulptrajecten, setFormDataSchuldhulptrajecten] = useState(
    initialFormData.leveringen[0].schuldhulptrajecten
  );

  
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
            <p>Met deze app is het mogelijk om op een laagdrempelige manier Schuldhulpinformatie conform de DDAS-uitwisselspecificatie op te stellen.</p>
            <p/>
            <p>In het kader van DDAS leveren gemeenten en andere schuldhulporganisaties gegevens aan het CBS, zodat op landelijk en gemeentelijk niveau inzicht ontstaat in stand van zaken rond schuldhulpverlening.</p>
            <p/>
            <p>Deze app kent naast het huidige tabblad 2 tabbladen waar de benodigde gegevens ingevuld moeten worden en het laatste tabblad geeft de mogelijkheid de voor DDAS bendoideg JSON te downloaden. Dit gedownloade bestand kunt u vervolgens bij het CBS-portaal uploaden.</p>
            <p>Mocht er al een JSON-bestand beschikbaar zijn dan kun je dat via onderstaande knop inladen.</p>
            <input type="file" accept="application/json" onChange={handleFileUpload} className="mt-3" />
            <br/>
            <br/>
            <p>Druk op volgende om te starten met het invullen van de benodigde informatie.</p>
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
              schema={singleDeliveryDefinition}
              uischema={uischemaSchuldhulptrajecten}
              data={formDataSchuldhulptrajecten}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ data }) => setFormDataSchuldhulptrajecten(data)}
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
        <pre>{JSON.stringify(formDataSchuldhulptrajecten, null, 2)}</pre>
      </div>
    </div>
  );
}

export default RegistrationForm;