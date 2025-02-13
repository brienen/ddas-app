import React from 'react';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { rankWith, isDateControl, resolveSchema } from '@jsonforms/core';
import { FormControl, TextField, Typography } from '@mui/material';

/**
 * Hulpfunctie om veldnamen (snake_case en camelCase) om te zetten naar een leesbaar label.
 */
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/_/g, ' ') // Vervang underscores door spaties
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Voeg spaties in tussen kleine letters en hoofdletters
    .replace(/^\w/, (c) => c.toUpperCase()); // Zet het eerste teken in hoofdletters
};

/**
 * Haal originele veldspecifieke eigenschappen op uit het root-schema.
 */
const getFieldProperties = (path, rootSchema) => {
  const pathParts = path.replace(/^#\/properties\//, '').split('/properties/');
  let current = rootSchema;

  for (const part of pathParts) {
    if (current && current.properties && current.properties[part]) {
      current = current.properties[part];
    } else {
      return null;
    }
  }

  return current;
};

const CustomDateFieldRenderer = (props) => {
  const { data, handleChange, path, visible, schema, uischema, errors, required, rootSchema } = props;

  if (!visible) {
    return null;
  }

  // 1. Haal originele veldspecifieke eigenschappen op
  const fieldProperties = getFieldProperties(path, rootSchema);

  // 2. Combineer de originele eigenschappen met het gede-referentieerde schema
  const resolvedSchema = schema.$ref ? resolveSchema(rootSchema, schema.$ref) : {};
  const combinedSchema = { ...resolvedSchema, ...schema, ...fieldProperties };

  // 3. Bepaal de description: volgorde uischema.description > schema.description > resolvedSchema.description
  const description =
    (uischema && uischema.options && uischema.options.description) ||
    combinedSchema.description ||
    resolvedSchema.description;

  // 4. Bepaal het label: volgorde uischema.label > combinedSchema.title > veldnaam
  const label =
    (uischema && uischema.label) || // Gebruik expliciet uischema.label als deze aanwezig is
    combinedSchema.title || // Gebruik de title uit het gecombineerde schema
    formatFieldName(path.split('/').pop()); // Gebruik de veldnaam als fallback

  return (
    <FormControl fullWidth style={{ marginBottom: '0.5em' }} error={!!errors}>
      {/* Datumveld met label */}
      <TextField
        id={path}
//      In Safari text veld omdat het veld anders niet leeg gemaakt kan worden
        type={navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") ? "text" : "date"}
        value={data || ''}
//      Bij een leeg veld, deze null maken om foutmelding dat het veld geen datum is, te voorkomen
        onChange={(event) => {
          const value = event.target.value === '' ? null : event.target.value;
          handleChange(path, value);
        }}
        placeholder="YYYY-MM-DD"
        inputProps={{
          pattern: "\\d{4}-\\d{2}-\\d{2}",
        }}
        label={`${label}${required ? ' *' : ''}`} // Voeg een sterretje toe als het veld verplicht is
        InputLabelProps={{ shrink: true }}
        error={!!errors && data !== null} // 🚀 Verberg fout als de waarde null is (omdat in v1.0 van het Schema null waarden niet mogen, maar wij dat wel toestaan)
        helperText={data !== null ? errors : ''}
        fullWidth
      />
      {/* Toon de description (indien aanwezig) */}
      {description && (
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: '0.5em' }}>
          {description}
        </Typography>
      )}
    </FormControl>
  );
};

// Tester die deze renderer koppelt aan datumvelden
export const customDateFieldTester = rankWith(
  5, // Prioriteit van deze renderer
  isDateControl // Controleert of het veld een datum is
);

export default withJsonFormsControlProps(CustomDateFieldRenderer);
