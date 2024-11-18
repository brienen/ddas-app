import { validateJSON } from './validation';

export async function downloadJSON(data, schema, bestandsnaam) {
  // Vul aanleverdatumEnTijd in
  const nu = new Date();
  data["aanleverdatumEnTijd"] = nu.getFullYear() + "-" + (nu.getMonth() + 1).toString() + "-" + nu.getDate() + "T" + (nu.getHours().toString().length < 2 ? "0" + nu.getHours() : nu.getHours()) + ":" + (nu.getMinutes().toString().length < 2 ? "0" + nu.getMinutes() : nu.getMinutes()) + ":00.000+01:00";
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
  const filename = prompt('Geef een bestandsnaam op:', bestandsnaam);
  if (filename === null || filename.trim() === '') {
    console.log('Bestandsopslag geannuleerd door de gebruiker.');
    return; // Stop met de functie als de gebruiker annuleert
  }
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
