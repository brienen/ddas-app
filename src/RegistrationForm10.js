import React, { useState, useEffect, useRef } from 'react';
import { JsonForms } from '@jsonforms/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Tabs, Tab, Button } from 'react-bootstrap';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import DDAS_logo from './DDAS_logo_org.png';
import './RegistrationForm.css';

import { validateJSON } from './validation';
import { downloadJSON } from './downloadJSON';
import { SaveShortcut } from './SaveShortcut';

import originalSchema from './json_schema_Uitwisselmodel.json';
import CustomDateFieldRenderer from './CustomDateFieldRenderer';
import { customDateFieldTester } from './CustomDateFieldRenderer';
// import { Description } from '@mui/icons-material';
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
  label: "Leveringsgegevens",
  elements: [
    { type: "Control", scope: "#/properties/startdatumLevering"},
    { type: "Control", scope: "#/properties/einddatumLevering" },
//        { type: "Control", scope: "#/properties/aanleverdatumEnTijd" },
    { type: "Control", scope: "#/properties/codeGegevensleverancier",options: {
      readonly: true
    } }
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
      label: "Algemeen: wat zijn de gemeentecode, de start- en einddatum en de totale schuld van het traject?",
      elements: [
        { type: "Control", scope: "#/properties/gemeentecode" },
        { type: "Control", scope: "#/properties/startdatum" },
        { type: "Control", scope: "#/properties/einddatum"  },
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
        { type: "Group",
          label: "Begeleiding",
          elements: [
            { type: "Control", scope: "#/properties/begeleiding" }
          ]
        },
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
        { type: "Group",
          label: "Crisisinterventies",
          elements: [
            { type: "Control", scope: "#/properties/crisisinterventies" },
          ]
        },
        { type: "Control", scope: "#/properties/informatieEnAdvies" },
        { type: "Group",
          label: "Voorlopige voorzieningen",
          elements: [
            { type: "Control", scope: "#/properties/voorlopigeVoorzieningen" },
          ]
        },
        { type: "Group",
          label: "Moratoria",
          elements: [
            { type: "Control", scope: "#/properties/moratoria" }
          ]
        }
      ]
    }
  ]
};

async function uploadJson(json, setFormAlgemeen, setFormLevering, setFormTrajecten, setCurrentTrajectIndex, bestandsnaam) {
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
    document.getElementById('uploadResultaat').innerHTML = 'Er zijn ' + json.leveringen[0].schuldhulptrajecten.length + ' trajecten ingelezen uit ' + bestandsnaam;
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
          uploadJson(json, setFormAlgemeen, setFormLevering, setFormTrajecten, setCurrentTrajectIndex, file.name);
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

  const theme = createTheme({ // overschrijven opmaak van formulier elementen
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#59377b', // Paarse border bij focus
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: 'gray', // Kleur van de labeltekst in rust (niet-focused)
            '&.Mui-focused': {
              color: '#59377b', // Kleur van de labeltekst bij focus
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          h5: {
            fontSize: '1.1rem',
            fontFamily: 'Manrope, sans-serif',
          },
          h6: {
            fontSize: '1.1rem',
            fontFamily: 'Manrope, sans-serif',
          },
        },
      },
      MuiGrid: {
        styleOverrides: {
          item: {
            marginBottom: '5px',
          },
        },
      },
    },
  });

  useEffect(() => {
    // groepen velden moeten ingeklapt en een click-event om open te klappen - gebeurt dynamisch met useEffect
    const container = containerRef.current;

    // Maak alle elementen met de class 'MuiCardContent-root' binnen de container onzichtbaar
    const contentElements = container.querySelectorAll(".MuiCardContent-root");
    contentElements.forEach((element) => {
      if (element.parentNode.innerText !== "Leveringsinformatie") element.style.display = "none";
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
    <div>
      <img className="logo" src={DDAS_logo} alt=""/>
      <h1>DDAS-Invoerapp</h1>

      <div className="container mt-4">

        <div ref={containerRef}>
          <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-3">

            <Tab eventKey="start" title="Start">
              <div className="p-3 border rounded bg-light">
              <h2>Welkom bij de DDAS-Invoerapp</h2>
              <p>In het kader van DDAS leveren gemeenten en andere schuldhulporganisaties gegevens aan het CBS, zodat op landelijk en gemeentelijk niveau inzicht ontstaat in de stand van zaken rond schuldhulpverlening. Kijk voor meer informatie <a href="https://www.divosa.nl/projecten/data-delen-armoede-en-schulden" target="_blank" title="open project website (in nieuw venster)" rel="noopener noreferrer">op de project-website</a>.<br />
              Met deze app is het mogelijk om met de hand schuldhulpverleningsinformatie conform de DDAS-uitwisselspecificatie op te stellen. Wat er in de verschillende velden ingevoerd moet worden is vastgelegd in <a href="https://vng-realisatie.github.io/ddas/v1.0/Detail_Model%20Schuldhulpverlening/" target="_blank" title="open informatiemodel met definities (in nieuw venster)" rel="noopener noreferrer">het informatiemodel voor DDAS</a>.</p>
              <p>Loop je tegen problemen aan? Werkt de invoerapp niet zoals verwacht? Of heb je suggesties voor verbeteringen?<br />
              Neem dan contact met ons op via het e-mailadres <a href="mailto:ddas@vng.nl" title="zend een bericht naar het project">ddas@vng.nl</a>.</p>
              <h2>Hoe werkt de invoerapp?</h2>
              <p>Deze app heeft naast dit startscherm twee tabbladen om de benodigde gegevens in te vullen. En daarnaast een tabblad waar je de ingevoerde gegevens in het vereiste JSON formaat kunt downloaden. Dit gedownloade JSON-bestand kan je vervolgens bij het <a href="https://www.cbs.nl/nl-nl/deelnemers-enquetes/bedrijven/overzicht-bedrijven/armoede-en-schulden" target="_blank">CBS-portaal</a> uploaden. Je kan er ook later verder aan werken door het <a href="#upload" title="ga naar uploadveld">hieronder</a> in te laden.</p>
              <p>Handig bij het invoeren:
                <ul>
                  <li>Voor de leesbaarheid zijn groepen velden samengevoegd en kan je ze tonen of verbergen door op het pijltje naast de titel te klikken.</li>
                  <li>Bij sommige velden kan je meer dan 1 item toevoegen. Klik op het plusteken naast de titel van het veld om een item toe te voegen. Reeds toegevoegde items kunnen verwijderd worden door op het prullenbak-teken naast het item te klikken.</li>
                  <li>Bij de schuldhulptrajecten start je met het eerste traject. Om een traject toe te voegen, klik je op "NIEUW TRAJECT" rechtsboven. Met de knoppen "vorig traject" en "volgend traject" kan je naar de andere trajecten navigeren.</li>
                </ul>
              </p>
              <hr />
              <p><strong>LET OP: als je deze pagina ververst of verlaat, dan worden alle velden leeg gemaakt!</strong><br />
              Sla daarom tussentijds de ingevoerde gegevens op in een JSON-bestand. Deze kan later weer ingeladen worden om er verder aan te werken.</p>
              <p>Deze app is (in deze versie) enkel getest in Chrome, Edge en Safari.</p>
              <hr />
              <h2><a id="#upload">Inladen eerder opgeslagen gegevens</a></h2>
              <p>Als je een JSON-bestand hebt met eerder ingevoerde gegevens, waar je verder aan wilt werken, dan kun je dat via onderstaande knop inladen. Let op: als je al gegevens hebt ingevoerd, worden die overschreven met de gegevens uit het JSON-bestand.</p>
              <input type="file" accept="application/json" onChange={handleFileUpload} className="btn btn-outline-primary" />
              <span className="uploadResultaat" id="uploadResultaat"></span>
              <br/>
              <hr />
              <p>Druk op "volgend tabblad" om te starten met het in- en/of aanvullen van de benodigde informatie.</p>
                <div className="d-flex justify-content-between mt-3">
                  <div></div>
                  <Button variant="primary" onClick={goToNextTab} title="Ga naar volgende tabblad">
                    volgend tabblad
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab eventKey="general" title="Algemene Gegevens">
              <div className="p-3 border rounded bg-light">
                <h2>Algemene Gegevens</h2>
                <p>Vul de gegevens van jouw organisatie in.</p>
                <ThemeProvider theme={theme}>
                  <JsonForms
                    schema={schemaLevering}
                    uischema={uischemaLevering}
                    data={formLevering}
                    renderers={[
                      ...materialRenderers,
                      { tester: customDateFieldTester, renderer: CustomDateFieldRenderer }
                    ]}
                    cells={materialCells}
                    onChange={({ data, errors }) => setFormLevering(data)}
                  />
                  </ThemeProvider>
                <h2>Gegevens over deze levering</h2>
                <p>Over welke periode worden gegevens over schuldhulptrajecten aangeleverd? Alle schuldhulptrajecten die tijdens deze periode actief waren (dus gestart voor de einddatum levering en nog niet afgerond of afgerond na de startdatum levering) moeten meegenomen worden bij "Schuldhulptrajecten".<br />
                NB: De Code Gegevensleverancier kan niet gewijzigd worden, maar is nodig voor de verwerking.</p>
                <ThemeProvider theme={theme}>
                  <JsonForms
                    schema={schemaAlgemeen}
                    uischema={uischemaAlgemeen}
                    data={formAlgemeen}
                    renderers={[
                      ...materialRenderers,
                      { tester: customDateFieldTester, renderer: CustomDateFieldRenderer }
                    ]}
                    cells={materialCells}
                    onChange={({ data, errors }) => setFormAlgemeen(data)}
                  />
                </ThemeProvider>
                <div className="d-flex justify-content-between mt-3">
                  <Button variant="primary" onClick={goToPreviousTab} title="Ga naar vorige tabblad">
                    vorig tabblad
                  </Button>
                  <Button variant="primary" onClick={goToNextTab} title="Ga naar volgende tabblad">
                    volgend tabblad
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab eventKey="schuldhulptrajecten" title="Schuldhulptrajecten">
              <div className="p-3 border rounded bg-light">
                <h2>Schuldhulptrajecten</h2>
                <p>Vul de gegevens in met betrekking tot schuldhulptrajecten die je wilt aanbieden. Vul steeds per client (of 2 clienten als ze gezamenlijk aansprakelijk zijn) de gegevens in van het schuldhulptraject wat hij/zij doorloopt, of heeft doorlopen. Zijn er meer cliënten maak dan nieuwe schuldhulptraject aan.</p>
                <div className="d-flex justify-content-between mt-3">
                  <Button variant="outline-primary"
                    onClick={() => setCurrentTrajectIndex(Math.max(currentTrajectIndex - 1, 0))}
                    disabled={currentTrajectIndex < 1}
                  >
                    vorig traject ({currentTrajectIndex} / {formTrajecten.length})
                  </Button>
                  <div>
                    dit is traject {currentTrajectIndex + 1} van de {formTrajecten.length} trajecten
                  </div>
                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      setCurrentTrajectIndex(currentTrajectIndex + 1)
                    }
                  >
                  {(currentTrajectIndex < formTrajecten.length - 1 ? <div>volgend traject ({currentTrajectIndex + 2} / {formTrajecten.length})</div> : <div>NIEUW TRAJECT</div>)}
                  </Button>
                </div>
                <hr />
                <div>
                  <ThemeProvider theme={theme}>
                    <JsonForms
                      schema={schemaTrajecten}
                      uischema={uischemaTrajecten}
                      data={formTrajecten[currentTrajectIndex]}
                      renderers={[
                        ...materialRenderers,
                        { tester: customDateFieldTester, renderer: CustomDateFieldRenderer }
                      ]}
                        cells={materialCells}
                      onChange={({ data: updatedData }) => {
                        const updatedTrajecten = [...formTrajecten];
                        updatedTrajecten[currentTrajectIndex] = updatedData;
                        setFormTrajecten(updatedTrajecten);
                      }}
                    />
                  </ThemeProvider>
                </div>

                <div className="d-flex justify-content-between mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => setCurrentTrajectIndex(Math.max(currentTrajectIndex - 1, 0))}
                    disabled={currentTrajectIndex < 1}
                  >
                    vorig traject ({currentTrajectIndex} / {formTrajecten.length})
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => {
                      const userConfirmed = window.confirm(
                        `Traject ${currentTrajectIndex + 1} ("${formTrajecten[currentTrajectIndex].omschrijving}") wordt verwijderd!\nWeet je het zeker?`
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
                    verwijder dit traject
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      setCurrentTrajectIndex(currentTrajectIndex + 1)
                    }
                  >
                  {(currentTrajectIndex < formTrajecten.length - 1 ? <div>volgend traject ({currentTrajectIndex + 2} / {formTrajecten.length})</div> : <div>NIEUW TRAJECT</div>)}
                  </Button>
                </div>

                <hr />

                <div className="d-flex justify-content-between mt-3">
                  <Button variant="primary" onClick={goToPreviousTab} title="Ga naar vorige tabblad">
                    vorig tabblad
                  </Button>
                  <Button variant="primary" onClick={goToNextTab} title="Ga naar volgende tabblad">
                    volgend tabblad
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab eventKey="export" title="Exporteren">
              <div className="p-3 border rounded bg-light">
                <h2>Exporteer Gegevens</h2>
                <p>Klik op de knop hieronder om de ingevoerde gegevens als JSON-bestand te downloaden.</p>
                <p>
                  <Button variant="primary" onClick={handleDownload} title="Sla de ingevoerde gegevens op in JSON-bestand">Download JSON-bestand</Button>
                  <span className="uploadResultaat" id="downloadResultaat"></span>
                </p>
                <p>Als de gegevens zijn opgeslagen zonder foutmeldingen, dan kan deze aan CBS aangeboden worden in hun <a href="https://www.cbs.nl/nl-nl/deelnemers-enquetes/bedrijven/overzicht-bedrijven/armoede-en-schulden" target="_blank">portaal Armoede en Schulden</a>.<br />
                De gegevens kunnen ook later in deze applicatie ingelezen worden om verder bewerkt te worden.</p>
                <hr />
                <div className="d-flex justify-content-between mt-3">
                  <Button variant="primary" onClick={goToPreviousTab} title="Ga naar vorige tabblad">
                    vorig tabblad
                  </Button>
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>

        <SaveShortcut data={formAlgemeen} formLevering={formLevering} formTrajecten={formTrajecten} schema={validateSchema} />

      </div>
    </div>
  );
}

export default RegistrationForm;
