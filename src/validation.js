import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export async function validateJSON(data, schema) {
  const ajv = new Ajv();
  addFormats(ajv);
  // Compileer en valideer het schema
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    console.error('Validatiefouten:', validate.errors);
    // Vraag de gebruiker om te bevestigen of het bestand toch ingelezen of opgeslagen moet worden
    const errors = validate.errors.map((error) => `${error.instancePath}: ${error.message}`).join('\n');
    const userConfirmed = window.confirm(
      `De gegevens zijn niet conform het schema:\n\n${errors}\n\nToch verder gaan?`
    );
    if (!userConfirmed) {
      return false;
    }
  }
  return true;
}
