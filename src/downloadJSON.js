import { validateJSON } from './validation';

async function generateFilename(data, formLevering, formTrajecten) {
  // Controleer of de vereiste gegevens aanwezig zijn
  const organisatieNaam =
    data?.leveringen?.[0]?.aanleverende_organisatie?.['(Statutaire) Naam'];

  if (!organisatieNaam) {
    console.warn('Organisatienaam niet gevonden. Bestandsnaam wordt standaard ingesteld.');
    return 'SHV_2024_organisatienaam.json';
  }

  // Vervang spaties door liggende streepjes
  const sanitizedOrganisatieNaam = organisatieNaam.replace(/ /g, '_');

  // Stel de bestandsnaam samen
  return `SHV_2024_${sanitizedOrganisatieNaam}.json`;
}

export async function downloadJSON(data, formLevering, formTrajecten, schema) {
  // Alles in formAlgemeen stoppen - eerst de leveringen leegmaken en dan de met formTrajecten gevulde formLevering toevorgen
  data.leveringen = [];
  formLevering.schuldhulptrajecten = formTrajecten;
  data.leveringen.push(formLevering);
  // Vul aanleverdatumEnTijd in
  const nu = new Date();
  data['aanleverdatumEnTijd'] = nu.getFullYear() + '-' + (nu.getMonth() + 1).toString() + '-' + nu.getDate() + 'T' + (nu.getHours().toString().length < 2 ? '0' + nu.getHours() : nu.getHours()) + ':' + (nu.getMinutes().toString().length < 2 ? '0' + nu.getMinutes() : nu.getMinutes()) + ':00.000+01:00';
  // check of object voldoet aan schema
  const isValid = await validateJSON(data, schema);
  if (!isValid) {
    return false;
  }
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  let bestandsnaam = await generateFilename(data);
  const filename = prompt('Geef een bestandsnaam op:', bestandsnaam);
  if (filename === null || filename.trim() === '') {
    return; // Stop met de functie als de gebruiker annuleert
  }
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
