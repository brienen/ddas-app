import React, { useState, useEffect, useRef } from 'react';
import { JsonForms } from '@jsonforms/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Tabs, Tab, Button } from 'react-bootstrap';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';

import { validateJSON } from './validation';
import { downloadJSON } from './downloadJSON';
import { SaveShortcut } from './SaveShortcut';
import './RegistrationForm.css';

import originalSchema from './json_schema_Uitwisselmodel.json';
// import schemaUrl from 'https://raw.githubusercontent.com/VNG-Realisatie/ddas/refs/heads/main/v1.0/json_schema_Uitwisselmodel.json';

const validateSchema = originalSchema;
const startdatumLevering = '2024-01-01';
const einddatumLevering = '2024-12-31';

// het schema wordt opgedeeld, maar de $defs moeten overal meegenomen worden - daarbij helpt deze functie
function addDefsToNestedProperties(schema, defs) {
  if (!schema.properties) {
    return schema;
  }
  const newProperties = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    newProperties[key] = {
      ...value,
      $defs: defs, // Voeg $defs toe aan elke eigenschap
    };
  }
  return {
    ...schema,
    properties: newProperties,
    $defs: defs, // Voeg ook $defs toe aan het hoofdschema
  };
}
// Extractie van $defs (gedeelde definities) - nodig om schema op te delen
const sharedDefs = originalSchema.$defs || originalSchema.definitions || {};
// Schema's voor algemeen, levering en schuldhulptrajecten
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
const schemaLevering = addDefsToNestedProperties(
  originalSchema.properties.leveringen.items,
  sharedDefs
);
const schemaTrajecten = addDefsToNestedProperties(
  originalSchema.properties.leveringen.items.properties.schuldhulptrajecten.items,
  sharedDefs
);

// Voorgevuld formData met één lege levering en nieuwe velden
const initialFormData = {
  startdatumLevering: startdatumLevering,
  einddatumLevering: einddatumLevering,
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
        { type: "Control", scope: "#/properties/startdatumLevering"},
        { type: "Control", scope: "#/properties/einddatumLevering" },
//        { type: "Control", scope: "#/properties/aanleverdatumEnTijd" },
        { type: "Control", scope: "#/properties/codeGegevensleverancier",options: {
          readonly: true
        } }
      ]
    }
  ]
};

const uischemaLevering = {
  type: "VerticalLayout",
  label: "Aanleverende Organisatie",
  elements: [
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/(Statutaire) Naam" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/KvK-nummer", "label": "Kvk-nummer" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/postcode" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/gemeentecode" },
    { type: "Control", scope: "#/properties/aanleverende_organisatie/properties/contactpersonen" },
  ]
};

const uischemaTrajecten = {
  type: "VerticalLayout",
  elements: [
//   { type: "Control", scope: "#" }
    { type: "Control", scope: "#/properties/omschrijving", label: "Omschrijving"},
    {
      type: "Group",
      label: "Algemeen: voor welke gemeente en over welke periode wordt de levering gedaan?",
      elements: [
        { type: "Control", scope: "#/properties/gemeentecode" },
        { type: "Control", scope: "#/properties/startdatum" },
        { type: "Control", scope: "#/properties/einddatum" },
        { type: "Control", scope: "#/properties/toekenningsdatum" },
        { type: "Control", scope: "#/properties/totaalSchuldbedragBijAanvangSchuld" }
      ]
    },
    {
      type: "Group",
      label: "Client en Schulden: om wie gaat het en wat zijn de schulden?",
      elements: [
        { type: "Control", scope: "#/properties/client" },
        { type: "Control", scope: "#/properties/schulden" }
      ]
    },
    {
      type: "Group",
      label: "Proces: welke stappen in het schuldhulptraject zijn doorlopen?",
      elements: [
        { type: "Control", scope: "#/properties/aanmelding"},
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
      label: "Overige: zijn er nog andere zaken die spelen?",
      elements: [
        { type: "Control", scope: "#/properties/crisisinterventies" },
        { type: "Control", scope: "#/properties/informatieEnAdvies" },
        { type: "Control", scope: "#/properties/voorlopigeVoorzieningen" },
        { type: "Control", scope: "#/properties/moratoria" }
      ]
    }
  ]
};

async function uploadJson(json, setFormAlgemeen, setFormLevering, setFormTrajecten, setCurrentTrajectIndex) {
  const isValid = await validateJSON(json, validateSchema);
  if (!isValid) {
    return false;
  }
  setFormAlgemeen(json);
  if (json.leveringen && json.leveringen.length > 0) setFormLevering(json.leveringen[0]);
  if (json.leveringen && json.leveringen.length > 0 && json.leveringen[0].schuldhulptrajecten) {
    setFormTrajecten(json.leveringen[0].schuldhulptrajecten);
    setCurrentTrajectIndex(0);
    console.log('Er zijn ' + json.leveringen[0].schuldhulptrajecten.length + ' trajecten ingelezen');
  }
}

function RegistrationForm() {
  const [formAlgemeen, setFormAlgemeen] = useState(initialFormData);
  const [formLevering, setFormLevering] = useState(
    initialFormData.leveringen && initialFormData.leveringen.length > 0
      ? initialFormData.leveringen[0]
      : {}
  );
  const [formTrajecten, setFormTrajecten] = useState(
    initialFormData.leveringen && initialFormData.leveringen.length > 0 &&
    initialFormData.leveringen[0].schuldhulptrajecten
      ? initialFormData.leveringen[0].schuldhulptrajecten
      : []
  );
  const [activeTab, setActiveTab] = useState("start");
  const [currentTrajectIndex, setCurrentTrajectIndex] = useState(0);
  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  const handleDownload = () => {
    downloadJSON(formAlgemeen, formLevering, formTrajecten, validateSchema);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          uploadJson(json, setFormAlgemeen, setFormLevering, setFormTrajecten, setCurrentTrajectIndex);
        } catch (error) {
          console.error("Error parsing JSON file", error);
          alert("Ongeldig JSON-bestand.");
        }
      };
      reader.fileName = file.name;
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

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    // Geef alle elementen met de class '.css-1vpwcmr-MuiGrid-root>.MuiGrid-item' (inputvelden) wat meer ruimte
    const contentInputvelden = container.querySelectorAll(".MuiGrid-item");
    contentInputvelden.forEach((element) => {
      element.style.marginBottom = "5px";
    });
    // Maak alle elementen met de class 'css-16xl4zq-MuiTypography-root' (label van groep) binnen de container kleiner maken
    const contentGroupLabels = container.querySelectorAll(".MuiTypography-h5");
    contentGroupLabels.forEach((element) => {
      element.style.fontSize = "1.3rem";
    });
    // Maak alle elementen met de class 'MuiCardContent-root' binnen de container onzichtbaar
    const contentElements = container.querySelectorAll(".MuiCardContent-root");
    contentElements.forEach((element) => {
      element.style.display = "none";
    });

    // Voeg event listeners toe aan de header-elementen
    const headerElements = container.querySelectorAll(".MuiCardHeader-title");
    const handleClick = (event) => {
      const header = event.target;
      const parent = header.parentElement.parentElement.parentElement; // eerst 3 niveaus omhoog
      const content = parent.querySelector(".MuiCardContent-root"); // dan naar groep
      if (content) {
        content.style.display = content.style.display === "none" ? "block" : "none";
        header.classList.toggle("open"); // Toggle de class "open"
      }
    };
    headerElements.forEach((header) => {
      header.addEventListener("click", handleClick);
    });

    // Cleanup: Verwijder event listeners bij unmounting
    return () => {
      headerElements.forEach((header) => {
        header.removeEventListener("click", handleClick);
      });
    };
  }, []); // Lege afhankelijkhedenlijst: wordt alleen uitgevoerd bij de eerste render

  return (
    <div className="container mt-4">
      <h2 className="mb-4">DDAS-Invoerapp</h2>

      <div ref={containerRef}>
        <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-3">

          <Tab eventKey="start" title="Start">
            <div className="p-3 border rounded bg-light">
            <h5>Welkom bij de DDAS-Invoerapp</h5>
            <p>Met deze app is het mogelijk om op een laagdrempelige manier Schuldhulpinformatie conform de DDAS-uitwisselspecificatie op te stellen.</p>
            <p/>
            <p>In het kader van DDAS leveren gemeenten en andere schuldhulporganisaties gegevens aan het CBS, zodat op landelijk en gemeentelijk niveau inzicht ontstaat in stand van zaken rond schuldhulpverlening.</p>
            <p/>
            <p>Deze app kent naast dit tabblad 2 tabbladen waar de benodigde gegevens ingevuld moeten worden en op het laatste tabblad geeft de mogelijkheid de voor DDAS benodigde JSON te downloaden (dit kan overigens ook overal door op Ctrl-s (Windows) of Cmd-s (MacOS) te drukken). Dit gedownloade bestand kunt u vervolgens bij het CBS-portaal uploaden.</p>
            <p>Mocht er al een JSON-bestand beschikbaar zijn waar je verder aan wilt werken, dan kun je dat via onderstaande knop inladen.</p>
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
              <p>Vul de gegevens in met betrekking tot schuldhulptrajecten die je wilt aanbieden. Vul steeds per client (of 2 clienten als ze gezamenlijk aansprakelijk zijn) de gegevens in van het schuldhulptraject wat hij/zij doorloopt, of heeft doorlopen. Zijn er meer cliënten maak dan nieuwe schuldhulptraject aan.</p>
              <div className="d-flex justify-content-between mt-3">
                <button
                  onClick={() => setCurrentTrajectIndex(Math.max(currentTrajectIndex - 1, 0))}
                  disabled={currentTrajectIndex < 1}
                >
                  Vorig Traject ({currentTrajectIndex} / {formTrajecten.length})
                </button>
                <div>
                  dit is traject {currentTrajectIndex + 1} van de {formTrajecten.length} trajecten
                </div>
                <button
                  onClick={() =>
                    setCurrentTrajectIndex(currentTrajectIndex + 1)
                  }
                >
                {(currentTrajectIndex < formTrajecten.length - 1 ? <div>Volgend Traject ({currentTrajectIndex + 2} / {formTrajecten.length})</div> : <div>NIEUW TRAJECT</div>)}
                </button>
              </div>
              <hr />
              <div>
                <JsonForms
                  schema={schemaTrajecten}
                  uischema={uischemaTrajecten}
                  data={formTrajecten[currentTrajectIndex]}
                  renderers={materialRenderers}
                  cells={materialCells}
                  onChange={({ data: updatedData }) => {
                    const updatedTrajecten = [...formTrajecten];
                    updatedTrajecten[currentTrajectIndex] = updatedData;
                    setFormTrajecten(updatedTrajecten);
                  }}
                />
              </div>

              <div className="d-flex justify-content-between mt-3">
                <button
                  onClick={() => setCurrentTrajectIndex(Math.max(currentTrajectIndex - 1, 0))}
                  disabled={currentTrajectIndex === 0}
                >
                  Vorig Traject ({currentTrajectIndex})
                </button>
                <button
                  onClick={() => {
                    console.log('trajecten: ' + JSON.stringify(formTrajecten, null, 2));
                    const userConfirmed = window.confirm(
                      `Traject ${currentTrajectIndex + 1} ("${formTrajecten[currentTrajectIndex].omschrijving}") wordt verwijderd!\nWeet u het zeker?`
                    );
                    if (!userConfirmed) {
                      return false;
                    } else {
                      console.log('Traject met id ' + currentTrajectIndex + ' wordt verwijderd.');
                      const newArray = formTrajecten.filter((item, index) => index !== currentTrajectIndex);
                      setFormTrajecten(newArray); // Updates the state with the new array
                      (currentTrajectIndex > 0 ? setCurrentTrajectIndex(currentTrajectIndex - 1) : setCurrentTrajectIndex(currentTrajectIndex));
                    }
                  }}
                  disabled={formTrajecten[currentTrajectIndex] === undefined}
                >
                  Verwijder dit traject
                </button>
                <button
                  onClick={() =>
                    setCurrentTrajectIndex(currentTrajectIndex + 1)
                  }
                >
                  {(currentTrajectIndex < formTrajecten.length - 1 ? <div>Volgend Traject ({currentTrajectIndex + 2})</div> : <div>NIEUW TRAJECT</div>)}
                </button>
              </div>

              <hr />

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
      </div>

      <SaveShortcut data={formAlgemeen} formLevering={formLevering} formTrajecten={formTrajecten} schema={validateSchema} />

    </div>
  );
}

export default RegistrationForm;
