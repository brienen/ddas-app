import { validateJSON } from './validation';
// import { formatDateToDMY } from './CustomDateFieldRenderer';
import { getLastHalfYearRange } from './CustomDateFieldRenderer';

async function generateFilename(data) {
  // Controleer of de vereiste gegevens aanwezig zijn
  let organisatieNaam = data?.leveringen?.[0]?.aanleverende_organisatie?.['(Statutaire) Naam'];
  let startLevering = data?.startdatumLevering;
  let eindLevering = data?.einddatumLevering;

  if (!organisatieNaam) {
    console.warn('Organisatienaam niet gevonden. Bestandsnaam wordt standaard ingesteld.');
    organisatieNaam = "organisatie";
  }
  // Vervang spaties door liggende streepjes
  const sanitizedOrganisatieNaam = organisatieNaam.replace(/[[&/#, +()$~%.'":@^*?<>{}]/g, '_');

  // periode in bestandsnaam
  if (startLevering == "" || eindLevering == "") {
    console.warn('Geen start- en/of einddatum levering gevonden - standaardwaarde wordt gebruikt');
    const { startdatumLevering, einddatumLevering } = getLastHalfYearRange();
    startLevering = startdatumLevering;
    eindLevering = einddatumLevering;
  }
  const startdatum = new Date(startLevering.substring(0,4), parseInt(startLevering.substring(5,7)) - 1, startLevering.substring(8,10));
  const einddatum = new Date(eindLevering.substring(0,4), parseInt(eindLevering.substring(5,7)) - 1, eindLevering.substring(8,10));
  let jaar = "";
  if ((einddatum.getFullYear() != startdatum.getFullYear()) && (einddatum.getMonth() > (11 - startdatum.getMonth()))) {
    jaar = einddatum.getFullYear();
  } else {
    jaar = startdatum.getFullYear();
  }
  const aantalMaanden = 12 * (einddatum.getFullYear() - startdatum.getFullYear()) + einddatum.getMonth() - startdatum.getMonth() + 1; // plus 1 omdat maanden bij 0 beginnen
  let periode = jaar;
  if (aantalMaanden < 3) {
    if (einddatum.getDate() > startdatum.getDate()) {
      periode = jaar + "M" + String(einddatum.getMonth() + 1).padStart(2, '0');
    } else {
      periode = jaar + "M" + String(startdatum.getMonth() + 1).padStart(2, '0');
    }
  } else if (aantalMaanden < 6) {
    if (jaar < einddatum.getFullYear()) {
      periode = jaar + "Q4";
    } else {
      periode = jaar + "Q" + String(Math.floor((einddatum.getMonth() + 1)/4) + 1);
    }
  } else if (aantalMaanden < 12) {
    if (jaar < einddatum.getFullYear()) {
      periode = jaar + "H2";
    } else {
      periode = jaar + "H" + String(Math.floor(einddatum.getMonth()/9) + 1);
    }
  }

  // Stel de bestandsnaam samen
  return `SHV_${periode}_${sanitizedOrganisatieNaam}.json`;
}

async function saveFileWithFallback(blob, filename, setIsSaved) {
  if ('showSaveFilePicker' in window) {
    console.log('showSaveFilePicker beschikbaar! Save As dialoog wordt aangeboden.');
    try {
      const options = {
        types: [
          {
            description: 'DDAS JSON bestand',
            accept: { 'application/json': ['.json'] },
          },
        ],
        suggestedName: filename,
      };
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      document.getElementById('downloadResultaat').innerHTML = 'Gegevens opgeslagen in bestand ' + handle.name;
      setIsSaved(true);
    } catch (error) {
      console.error('Opslaan geannuleerd of fout:', error);
      document.getElementById('downloadResultaat').innerHTML = 'Opslaan is afgebroken - bestand NIET opgeslagen';
    }
  } else {
    // Fallback: Gebruik standaard downloadgedrag
    console.warn('File System Access API niet beschikbaar. Gebruik standaard download.');
    filename = prompt('LET OP!\n\nUw browser ondersteunt geen locatiekeuze voor bestanden. Het bestand wordt opgeslagen in de standaard "Downloads" map.\n\nGeef een bestandsnaam op:', filename);
    if (filename === null || filename.trim() === '') {
      console.warn('Gebruiker heeft opslaan afgebroken.');
      document.getElementById('downloadResultaat').innerHTML = 'Opslaan is afgebroken - bestand NIET opgeslagen';
      return; // Stop met de functie als de gebruiker annuleert
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.getElementById('downloadResultaat').innerHTML = 'Gegevens opgeslagen in bestand ' + filename;
    setIsSaved(true);
  }
}

// functie om null waarden te verwijderen - omdat v1.0 van het Schema geen null waarden accepteert
function removeNullValues(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(item => item !== null);
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => [key, removeNullValues(value)]) // Recursief aanroepen
        .filter(([_, value]) => value !== null) // Null-waarden verwijderen
    );
  }
  return obj; // Laat andere waarden ongemoeid
}

export async function downloadJSON(data, formLevering, formTrajecten, schema, setIsSaved) {

  // Alles in formAlgemeen (data) stoppen - eerst de leveringen leegmaken en dan de met formTrajecten gevulde formLevering toevorgen
  data.leveringen = [];
  formLevering.schuldhulptrajecten = formTrajecten;
  data.leveringen.push(formLevering);
  // Vul aanleverdatumEnTijd in
  const nu = new Date();
  const maand = nu.getMonth() + 1;
  data.aanleverdatumEnTijd = nu.getFullYear() + '-' + (maand.toString().length < 2 ? '0' + maand : maand) + '-' + (nu.getDate().toString().length < 2 ? '0' + nu.getDate() : nu.getDate()) + 'T' + (nu.getHours().toString().length < 2 ? '0' + nu.getHours() : nu.getHours()) + ':' + (nu.getMinutes().toString().length < 2 ? '0' + nu.getMinutes() : nu.getMinutes()) + ':00.000+01:00';
  // haal entries met null waarden weg
  const cleanedData = removeNullValues(data);
  // check of object voldoet aan schema
  const isValid = await validateJSON(cleanedData, schema);
  if (!isValid) {
    return false;
  }
  const json = JSON.stringify(cleanedData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  let bestandsnaam = await generateFilename(data);
  saveFileWithFallback(blob, bestandsnaam, setIsSaved);
}
